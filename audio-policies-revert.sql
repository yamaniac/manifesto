-- =============================================
-- REVERT AUDIO STORAGE POLICIES
-- =============================================
-- Run this SQL to restore the original audio storage policies

-- First, drop all existing policies for the audio-files bucket
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;

-- =============================================
-- RESTORE ORIGINAL AUDIO STORAGE POLICIES
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
-- VERIFY POLICIES
-- =============================================
-- You can run this query to check the current policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%audio%';
