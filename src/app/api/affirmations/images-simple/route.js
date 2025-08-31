import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('Simple POST /api/affirmations/images-simple called');
    
    // Check if Pixabay API key is configured
    const pixabayKey = process.env.PIXABAY_API || process.env.PIXABAY_API_KEY || process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
    console.log('Pixabay API key found:', pixabayKey ? 'Yes' : 'No');
    
    if (!pixabayKey) {
      console.error('Pixabay API key not configured');
      return NextResponse.json(
        { error: 'Pixabay API key not configured' },
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

    const { affirmationId, categoryName } = requestBody;
    
    if (!affirmationId || !categoryName) {
      return NextResponse.json(
        { error: 'Affirmation ID and category name are required' },
        { status: 400 }
      );
    }

    // Simple response without external dependencies
    return NextResponse.json({
      success: true,
      message: 'Simple API working',
      data: {
        affirmationId,
        categoryName,
        pixabayKey: pixabayKey ? 'Configured' : 'Not configured'
      }
    });

  } catch (error) {
    console.error('Error in simple API:', error);
    return NextResponse.json(
      { error: 'Simple API error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple affirmations images API endpoint',
    status: 'working'
  });
}
