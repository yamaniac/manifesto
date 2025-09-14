import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/audio/[id] - Update audio file
export async function PUT(request, { params }) {
  try {
    const supabase = createClient();
    const { id } = params;
    
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

    // Parse request body
    const { title, description } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Update audio file
    const { data: audioFile, error: updateError } = await supabase
      .from('audio_files')
      .update({
        title: title.trim(),
        description: description ? description.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating audio file:', updateError);
      return NextResponse.json({ error: 'Failed to update audio file' }, { status: 500 });
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Audio file updated successfully',
      data: audioFile
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/audio/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/audio/[id] - Delete audio file
export async function DELETE(request, { params }) {
  try {
    const supabase = createClient();
    const { id } = params;
    
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

    // Get audio file details first
    const { data: audioFile, error: fetchError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !audioFile) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }

    // Delete from storage
    try {
      const { createClient } = await import('@/lib/supabase/admin');
      const supabaseAdmin = createClient();
      const STORAGE_BUCKET = 'audio-files';

      const { error: storageError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([audioFile.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    } catch (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('audio_files')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting audio file from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete audio file' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Audio file deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/audio/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

