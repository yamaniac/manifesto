import { NextResponse } from 'next/server';
import { initializeStorage } from '@/lib/storage';

/**
 * POST /api/storage/init
 * Initialize the storage bucket for affirmation images
 */
export async function POST() {
  try {
    const success = await initializeStorage();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Storage bucket initialized successfully. Please run the SQL policies manually in Supabase dashboard.',
        instructions: {
          step1: 'Go to Supabase Dashboard > Storage > Policies',
          step2: 'Add the following policies for the affirmation-images bucket:',
          policies: [
            'CREATE POLICY "Authenticated users can upload affirmation images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = \'affirmation-images\' AND auth.role() = \'authenticated\');',
            'CREATE POLICY "Public read access for affirmation images" ON storage.objects FOR SELECT USING (bucket_id = \'affirmation-images\');',
            'CREATE POLICY "Users can update their own affirmation images" ON storage.objects FOR UPDATE USING (bucket_id = \'affirmation-images\' AND auth.role() = \'authenticated\');',
            'CREATE POLICY "Users can delete their own affirmation images" ON storage.objects FOR DELETE USING (bucket_id = \'affirmation-images\' AND auth.role() = \'authenticated\');'
          ]
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize storage bucket' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    return NextResponse.json(
      { error: 'Failed to initialize storage: ' + error.message },
      { status: 500 }
    );
  }
}

