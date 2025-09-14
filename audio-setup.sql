-- =============================================
-- AUDIO FILES SETUP FOR MANIFESTO
-- =============================================
-- Run this SQL after the main supabase-setup.sql

-- =============================================
-- AUDIO FILES TABLE SETUP
-- =============================================

-- Create audio_files table
CREATE TABLE audio_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audio_files table
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Audio Files Policies
CREATE POLICY "Anyone can view audio files"
    ON audio_files FOR SELECT
    USING (true);

CREATE POLICY "Super admins can insert audio files"
    ON audio_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update audio files"
    ON audio_files FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete audio files"
    ON audio_files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Trigger to auto-update updated_at on audio_files
CREATE TRIGGER update_audio_files_updated_at
    BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUDIO STORAGE BUCKET SETUP
-- =============================================

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- AUDIO STORAGE RLS POLICIES
-- =============================================

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to audio files
CREATE POLICY "Public read access for audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

-- Allow users to update their own audio files
CREATE POLICY "Users can update their own audio files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio-files' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-files' 
  AND auth.role() = 'authenticated'
);

-- =============================================
-- AUDIO SETUP COMPLETE
-- =============================================
-- You can now use the audio management features in the admin dashboard
