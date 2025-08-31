import { NextResponse } from 'next/server';
import { getRandomImageForCategory } from '@/lib/pixabay';
import { storeImageFromUrl, deleteImageFromStorage } from '@/lib/storage';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/affirmations/images
 * Fetch and store image for an affirmation based on category
 */
export async function POST(request) {
  try {
    console.log('POST /api/affirmations/images called');
    
    // Check if required functions are available
    if (!getRandomImageForCategory || !storeImageFromUrl || !deleteImageFromStorage || !createClient) {
      console.error('Required functions not available:', {
        getRandomImageForCategory: !!getRandomImageForCategory,
        storeImageFromUrl: !!storeImageFromUrl,
        deleteImageFromStorage: !!deleteImageFromStorage,
        createClient: !!createClient
      });
      return NextResponse.json(
        { error: 'Server configuration error. Please check server logs.' },
        { status: 500 }
      );
    }
    
    // Check if Pixabay API key is configured
    const pixabayKey = process.env.PIXABAY_API || process.env.PIXABAY_API_KEY || process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
    console.log('Pixabay API key found:', pixabayKey ? 'Yes' : 'No');
    
    if (!pixabayKey) {
      console.error('Pixabay API key not configured');
      return NextResponse.json(
        { error: 'Pixabay API key not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    const { affirmationId, categoryName, affirmationText } = requestBody;
    
    if (!affirmationId || !categoryName) {
      console.error('Missing required fields:', { affirmationId, categoryName });
      return NextResponse.json(
        { error: 'Affirmation ID and category name are required' },
        { status: 400 }
      );
    }

    console.log('Fetching image for category:', categoryName);
    
    // Fetch image from Pixabay based on category
    const pixabayImage = await getRandomImageForCategory(categoryName);
    
    if (!pixabayImage) {
      console.log('No image found for category:', categoryName);
      return NextResponse.json(
        { error: 'No suitable image found for this category' },
        { status: 404 }
      );
    }

    console.log('Image found:', pixabayImage.url);

    // Generate unique filename for storage
    const timestamp = Date.now();
    const fileName = `affirmation_${affirmationId}_${timestamp}`;
    
    // Store image in Supabase storage using admin client
    const storageResult = await storeImageFromUrl(
      pixabayImage.url,
      fileName,
      pixabayImage.alt_text
    );

    // Update affirmation with image URL using regular client
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('affirmations')
      .update({
        image_url: storageResult.public_url,
        image_alt_text: storageResult.alt_text
      })
      .eq('id', affirmationId);

    if (updateError) {
      // If update fails, clean up the stored image
      await deleteImageFromStorage(storageResult.storage_path);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      image: {
        url: storageResult.public_url,
        alt_text: storageResult.alt_text,
        storage_path: storageResult.storage_path
      }
    });

  } catch (error) {
    console.error('Error processing affirmation image:', error);
    return NextResponse.json(
      { error: 'Failed to process image for affirmation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/affirmations/images
 * Get image suggestions for a category (without storing)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get('category');
    
    if (!categoryName) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Fetch image suggestions from Pixabay
    const pixabayImage = await getRandomImageForCategory(categoryName);
    
    if (!pixabayImage) {
      return NextResponse.json(
        { error: 'No suitable image found for this category' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image: pixabayImage
    });

  } catch (error) {
    console.error('Error fetching image suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image suggestions' },
      { status: 500 }
    );
  }
}
