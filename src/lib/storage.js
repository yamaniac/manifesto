/**
 * Supabase Storage service for managing affirmation images
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// Client for public operations
const supabase = createClient();
// Admin client with storage credentials for elevated permissions
const supabaseAdmin = createAdminClient();
const STORAGE_BUCKET = 'affirmation-images';

/**
 * Initialize storage bucket if it doesn't exist
 * Note: This should be run once during setup
 */
export async function initializeStorage() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;
    
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Create bucket with public access for images using admin client
      const { error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB limit
      });
      
      if (createError) throw createError;
      console.log('Storage bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}

/**
 * Download image from URL and upload to Supabase storage
 * @param {string} imageUrl - URL of the image to download
 * @param {string} fileName - Name for the stored file
 * @param {string} altText - Alt text for the image
 * @returns {Promise<Object>} Object with storage URL and metadata
 */
export async function storeImageFromUrl(imageUrl, fileName, altText) {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const imageBlob = await response.blob();
    const fileExtension = imageUrl.split('.').pop().split('?')[0] || 'jpg';
    const fullFileName = `${fileName}.${fileExtension}`;
    
    // Upload to Supabase storage using admin client for elevated permissions
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fullFileName, imageBlob, {
        contentType: imageBlob.type,
        metadata: {
          alt_text: altText,
          source_url: imageUrl,
          uploaded_at: new Date().toISOString()
        }
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fullFileName);
    
    return {
      storage_path: data.path,
      public_url: urlData.publicUrl,
      alt_text: altText,
      file_size: imageBlob.size,
      content_type: imageBlob.type
    };
  } catch (error) {
    console.error('Error storing image:', error);
    throw error;
  }
}

/**
 * Delete image from storage
 * @param {string} filePath - Path of the file in storage
 * @returns {Promise<boolean>} Success status
 */
export async function deleteImageFromStorage(filePath) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    return false;
  }
}

/**
 * Get all images from storage bucket
 * @returns {Promise<Array>} Array of image objects
 */
export async function getAllStoredImages() {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 100,
        offset: 0
      });
    
    if (error) throw error;
    
    return data.map(file => ({
      name: file.name,
      path: file.path,
      size: file.metadata?.size,
      created_at: file.created_at,
      updated_at: file.updated_at
    }));
  } catch (error) {
    console.error('Error getting stored images:', error);
    return [];
  }
}

/**
 * Get public URL for a stored image
 * @param {string} filePath - Path of the file in storage
 * @returns {string} Public URL
 */
export function getImagePublicUrl(filePath) {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
