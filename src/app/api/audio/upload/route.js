import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Configure this route for large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb', // Increased limit for large audio files
    },
  },
  // Increase timeout for this route - 15 minutes for large audio files
  maxDuration: 900, // 15 minutes
};

const MAX_FILES = 5; // Reduced for large files
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const ALLOWED_TYPES = [
  'audio/mpeg', 
  'audio/mp3', 
  'audio/wav', 
  'audio/ogg', 
  'audio/m4a', 
  'audio/aac',
  'audio/webm'
];

// POST /api/audio/upload - Upload multiple audio files
export async function POST(request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin');

    if (roleError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    // Parse form data with timeout
    let formData;
    try {
      formData = await Promise.race([
        request.formData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Form data parsing timeout')), 60000)
        )
      ]);
    } catch (error) {
      console.error('Form data parsing error:', error);
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
    }

    const files = formData.getAll('files');
    const titles = formData.getAll('titles');
    const descriptions = formData.getAll('descriptions');

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    if (files.length !== titles.length || files.length !== descriptions.length) {
      return NextResponse.json({ error: 'Number of files, titles, and descriptions must match' }, { status: 400 });
    }

    const uploadResults = [];
    const errors = [];

    // Process files one by one for large audio files to avoid timeout
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = titles[i];
      const description = descriptions[i];

      try {
        // Process single file with extended timeout
        await Promise.race([
          processSingleFile(file, title, description, user.id, supabase, uploadResults, errors, i),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File processing timeout')), 600000) // 10 minutes per file
          )
        ]);
      } catch (error) {
        console.error(`Error processing file ${i + 1}:`, error);
        errors.push({ filename: file.name, error: 'File processing timeout' });
        uploadResults.push({ success: false, error: 'File processing timeout' });
      }
    }

    const successCount = uploadResults.filter(r => r.success).length;
    const errorCount = uploadResults.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Upload completed: ${successCount} successful, ${errorCount} failed`,
      data: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Unexpected error in audio upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validate audio file
function validateFile(file) {
  if (!file) {
    return 'No file provided';
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  return null;
}

// Process a single audio file
async function processSingleFile(file, title, description, userId, supabase, uploadResults, errors, fileIndex) {
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      errors.push({ filename: file.name, error: validationError });
      uploadResults.push({ success: false, error: validationError });
      return;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${timestamp}_${randomId}.${fileExtension}`;

    console.log(`Processing file ${fileIndex + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Upload to storage
    const uploadResult = await uploadAudioToStorage(file, uniqueFilename, userId);
    
    if (!uploadResult.success) {
      errors.push({ filename: file.name, error: uploadResult.error });
      uploadResults.push({ success: false, error: uploadResult.error });
      return;
    }

    console.log(`File ${fileIndex + 1} uploaded successfully: ${file.name}`);

    // Save to database
    const { data: audioRecord, error: dbError } = await supabase
      .from('audio_files')
      .insert({
        filename: uniqueFilename,
        original_filename: file.name,
        file_path: uploadResult.storage_path,
        file_url: uploadResult.public_url,
        file_size: file.size,
        content_type: file.type,
        title: title || file.name,
        description: description || '',
        uploaded_by: userId
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error for file:', file.name, dbError);
      errors.push({ filename: file.name, error: 'Failed to save to database' });
      uploadResults.push({ success: false, error: 'Failed to save to database' });
      return;
    }

    uploadResults.push({ 
      success: true, 
      data: audioRecord,
      filename: file.name 
    });

    console.log(`File ${fileIndex + 1} saved to database: ${file.name}`);

  } catch (error) {
    console.error('Error processing file:', file.name, error);
    errors.push({ filename: file.name, error: error.message });
    uploadResults.push({ success: false, error: error.message });
  }
}

// Upload audio file to storage
async function uploadAudioToStorage(file, filename, userId) {
  try {
    const { createClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createClient();
    const STORAGE_BUCKET = 'audio-files';

    // Upload directly to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file, {
        contentType: file.type,
        metadata: {
          original_filename: file.name,
          uploaded_by: userId,
          uploaded_at: new Date().toISOString()
        }
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);

    return {
      success: true,
      storage_path: data.path,
      public_url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Storage upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
