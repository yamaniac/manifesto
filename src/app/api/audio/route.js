import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/audio - Get all audio files
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

    // Get all audio files
    const { data: audioFiles, error } = await supabase
      .from('audio_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio files:', error);
      return NextResponse.json({ error: 'Failed to fetch audio files' }, { status: 500 });
    }

    return NextResponse.json({
      data: audioFiles || []
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/audio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

