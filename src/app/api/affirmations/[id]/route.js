import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/affirmations/[id] - Fetch a single affirmation
export async function GET(request, { params }) {
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

    const { id } = params;

    const { data: affirmation, error } = await supabase
      .from('affirmations')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          description
        ),
        images (
          id,
          filename,
          file_url,
          original_filename
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching affirmation:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Affirmation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch affirmation' }, { status: 500 });
    }

    return NextResponse.json({ data: affirmation });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/affirmations/[id] - Update an affirmation
export async function PUT(request, { params }) {
  try {
    const supabase = createClient();
    
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

    const { id } = params;
    const body = await request.json();
    const { text, category_id, image_id } = body;

    // Validate required fields
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Affirmation text is required' }, { status: 400 });
    }

    if (!category_id) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Verify image exists if provided
    if (image_id) {
      const { data: image, error: imageError } = await supabase
        .from('images')
        .select('id')
        .eq('id', image_id)
        .single();

      if (imageError || !image) {
        return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
      }
    }

    const { data: affirmation, error } = await supabase
      .from('affirmations')
      .update({
        text: text.trim(),
        category_id,
        image_id: image_id || null
      })
      .eq('id', id)
      .select(`
        *,
        categories (
          id,
          name,
          color,
          description
        ),
        images (
          id,
          filename,
          file_url,
          original_filename
        )
      `)
      .single();

    if (error) {
      console.error('Error updating affirmation:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Affirmation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update affirmation' }, { status: 500 });
    }

    return NextResponse.json({ data: affirmation });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/affirmations/[id] - Delete an affirmation
export async function DELETE(request, { params }) {
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

    const { id } = params;

    const { error: deleteError } = await supabase
      .from('affirmations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting affirmation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete affirmation' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Affirmation deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
