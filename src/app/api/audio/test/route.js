import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/audio/test - Test audio storage connection
export async function GET() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin');

    if (roleError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    // Test storage bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json({
        error: 'Failed to access storage',
        details: bucketsError.message
      }, { status: 500 });
    }

    const audioBucket = buckets.find(bucket => bucket.name === 'audio-files');
    
    if (!audioBucket) {
      return NextResponse.json({
        error: 'Audio storage bucket not found',
        suggestion: 'Run the audio-setup.sql file in your Supabase dashboard first'
      }, { status: 404 });
    }

    // Test database table access
    const { data: audioFiles, error: dbError } = await supabase
      .from('audio_files')
      .select('count')
      .limit(1);

    if (dbError) {
      return NextResponse.json({
        error: 'Database table not found',
        details: dbError.message,
        suggestion: 'Run the audio-setup.sql file in your Supabase dashboard first'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Audio storage is properly configured',
      storage: {
        bucketExists: true,
        bucketName: audioBucket.name,
        bucketId: audioBucket.id,
        public: audioBucket.public
      },
      database: {
        tableExists: true,
        tableName: 'audio_files'
      }
    });

  } catch (error) {
    console.error('Error testing audio storage:', error);
    return NextResponse.json({
      error: 'Test failed: ' + error.message,
      details: error.message
    }, { status: 500 });
  }
}

