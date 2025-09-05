import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

// POST /api/images/upload - Upload multiple images with category assignment
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

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files');
    const categories = formData.getAll('categories');

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    if (files.length !== categories.length) {
      return NextResponse.json({ error: 'Number of files and categories must match' }, { status: 400 });
    }

    // Validate categories exist
    const { data: existingCategories, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .in('id', categories);

    if (categoryError) {
      console.error('Error validating categories:', categoryError);
      return NextResponse.json({ error: 'Failed to validate categories' }, { status: 500 });
    }

    const validCategoryIds = existingCategories.map(cat => cat.id);
    const invalidCategories = categories.filter(catId => !validCategoryIds.includes(catId));
    
    if (invalidCategories.length > 0) {
      return NextResponse.json({ error: 'Invalid category IDs provided' }, { status: 400 });
    }

    const uploadResults = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const categoryId = categories[i];

      try {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          errors.push({ filename: file.name, error: validationError });
          uploadResults.push({ success: false, error: validationError });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${timestamp}_${randomId}.${fileExtension}`;

        // Upload to storage
        const uploadResult = await uploadFileToStorage(file, uniqueFilename, user.id);
        
        if (!uploadResult.success) {
          errors.push({ filename: file.name, error: uploadResult.error });
          uploadResults.push({ success: false, error: uploadResult.error });
          continue;
        }

        // Save to database
        const { data: imageRecord, error: dbError } = await supabase
          .from('images')
          .insert({
            filename: uniqueFilename,
            original_filename: file.name,
            file_path: uploadResult.storage_path,
            file_url: uploadResult.public_url,
            file_size: file.size,
            content_type: file.type,
            category_id: categoryId,
            uploaded_by: user.id
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error for file:', file.name, dbError);
          errors.push({ filename: file.name, error: 'Failed to save to database' });
          uploadResults.push({ success: false, error: 'Failed to save to database' });
          continue;
        }

        uploadResults.push({ 
          success: true, 
          data: imageRecord,
          filename: file.name 
        });

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        errors.push({ filename: file.name, error: error.message });
        uploadResults.push({ success: false, error: error.message });
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
    console.error('Unexpected error in upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validate file
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

// Upload file to storage
async function uploadFileToStorage(file, filename, userId) {
  try {
    const { createClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createClient();
    const STORAGE_BUCKET = 'affirmation-images';

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
