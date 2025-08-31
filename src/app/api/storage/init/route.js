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
        message: 'Storage bucket initialized successfully'
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
      { error: 'Failed to initialize storage' },
      { status: 500 }
    );
  }
}
