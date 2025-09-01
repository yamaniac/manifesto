# Manifesto

A Next.js application for managing affirmations with AI-powered image generation and manual image upload capabilities.

## Features

- **Affirmations Management**: Create, edit, and organize positive affirmations
- **AI Image Generation**: Automatically fetch relevant images from Pixabay based on categories
- **Manual Image Upload**: Upload custom images for affirmations
- **Category Management**: Organize affirmations with color-coded categories
- **Super Admin Access**: Comprehensive management interface for administrators

## Database Setup

### Required Fields for Affirmations Table

The affirmations table needs the following additional fields for image functionality:

```sql
-- Add these fields to your affirmations table if they don't exist
ALTER TABLE affirmations 
ADD COLUMN image_url TEXT,
ADD COLUMN image_alt_text TEXT,
ADD COLUMN is_manual_image BOOLEAN DEFAULT false;
```

### Storage Setup

Initialize the storage bucket for affirmation images:

1. **Initialize Bucket**: Open `test-storage-init.html` in your browser and click "Initialize Storage Bucket"
2. **Set Up RLS Policies**: After bucket creation, you MUST manually add the RLS policies in Supabase Dashboard:
   - Go to Supabase Dashboard → Storage → Policies
   - Select the `affirmation-images` bucket
   - Add the 4 required policies (see `test-storage-init.html` for exact SQL)
3. **Database Migration**: Run the SQL migration to add image fields to affirmations table

**Important**: The RLS policies are required for manual image uploads to work. Without them, you'll get "row violates row-level security policy" errors.

## Development

1. Install dependencies: `npm install`
2. Set up your Supabase environment variables
3. Run the database migration
4. Initialize storage bucket
5. Start development server: `npm run dev`

## API Endpoints

- `POST /api/affirmations/images` - Fetch AI-generated images from Pixabay
- `POST /api/storage/init` - Initialize storage bucket
- `POST /api/auth/callback` - Authentication callback

## Image Management

- **Automatic Images**: Fetched from Pixabay based on category and affirmation text
- **Manual Images**: Upload custom images with automatic compression
- **Image Compression**: 
  - Automatic compression to 1MB max file size
  - Max resolution: 1920px (width or height)
  - Real-time compression progress indicator
  - File size savings display
- **Image Controls**: 
  - Refresh button for AI-generated images
  - Delete button for manually uploaded images
  - Upload icon for adding custom images
- **Smart Refresh**: Refresh button is disabled for manually uploaded images until deleted
- **Supported Formats**: JPG, PNG, WebP, GIF (original max 5MB, compressed to 1MB)
