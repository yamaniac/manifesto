import { NextResponse } from 'next/server';

export async function GET() {
  const results = {};
  
  // Test Pixabay module
  try {
    const pixabayModule = await import('@/lib/pixabay');
    results.pixabay = {
      success: true,
      functions: Object.keys(pixabayModule)
    };
  } catch (error) {
    results.pixabay = {
      success: false,
      error: error.message
    };
  }
  
  // Test Storage module
  try {
    const storageModule = await import('@/lib/storage');
    results.storage = {
      success: true,
      functions: Object.keys(storageModule)
    };
  } catch (error) {
    results.storage = {
      success: false,
      error: error.message
    };
  }
  
  // Test Supabase server module
  try {
    const supabaseModule = await import('@/lib/supabase/server');
    results.supabase = {
      success: true,
      functions: Object.keys(supabaseModule)
    };
  } catch (error) {
    results.supabase = {
      success: false,
      error: error.message
    };
  }
  
  // Test Supabase admin module
  try {
    const adminModule = await import('@/lib/supabase/admin');
    results.admin = {
      success: true,
      functions: Object.keys(adminModule)
    };
  } catch (error) {
    results.admin = {
      success: false,
      error: error.message
    };
  }
  
  return NextResponse.json({
    message: 'Module import test results',
    results
  });
}
