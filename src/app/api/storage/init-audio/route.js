import { NextResponse } from 'next/server';
import { initializeAudioStorage } from '@/lib/storage';

/**
 * POST /api/storage/init-audio
 * Initialize the storage bucket for audio files
 */
export async function POST() {
  try {
    const success = await initializeAudioStorage();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Audio storage bucket initialized successfully. If you ran the SQL setup, the storage policies should already be configured.',
        instructions: {
          step1: 'Go to Supabase Dashboard > Storage > Policies',
          step2: 'Verify the following policies exist for the audio-files bucket:',
          policies: [
            'CREATE POLICY "Authenticated users can upload audio files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = \'audio-files\' AND auth.role() = \'authenticated\');',
            'CREATE POLICY "Public read access for audio files" ON storage.objects FOR SELECT USING (bucket_id = \'audio-files\');',
            'CREATE POLICY "Users can update their own audio files" ON storage.objects FOR UPDATE USING (bucket_id = \'audio-files\' AND auth.role() = \'authenticated\');',
            'CREATE POLICY "Users can delete their own audio files" ON storage.objects FOR DELETE USING (bucket_id = \'audio-files\' AND auth.role() = \'authenticated\');'
          ]
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize audio storage bucket' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing audio storage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize audio storage: ' + error.message,
        details: error.message,
        suggestion: 'Make sure you have run the audio-setup.sql file in your Supabase dashboard first.'
      },
      { status: 500 }
    );
  }
}
