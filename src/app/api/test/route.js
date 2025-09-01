import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Test API endpoint working',
    timestamp: new Date().toISOString(),
    environment: {
      pixabayKey: process.env.PIXABAY_API ? 'Found' : 'Not found',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Not found'
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Test POST endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse request body',
      details: error.message
    }, { status: 400 });
  }
}

