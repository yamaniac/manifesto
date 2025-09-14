import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/affirmations - Fetch affirmations with optional filtering
export async function GET(request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.textSearch('text', search);
    }

    const { data: affirmations, error, count } = await query;

    if (error) {
      console.error('Error fetching affirmations:', error);
      return NextResponse.json({ error: 'Failed to fetch affirmations' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('affirmations')
      .select('*', { count: 'exact', head: true });

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId);
    }

    if (search) {
      countQuery = countQuery.textSearch('text', search);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      data: affirmations || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/affirmations - Create a new affirmation
export async function POST(request) {
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
      .insert({
        text: text.trim(),
        category_id,
        image_id: image_id || null,
        created_by: user.id
      })
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
      console.error('Error creating affirmation:', error);
      return NextResponse.json({ error: 'Failed to create affirmation' }, { status: 500 });
    }

    return NextResponse.json({ data: affirmation }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/affirmations - Delete multiple affirmations
export async function DELETE(request) {
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

    const { affirmationIds } = await request.json();

    if (!affirmationIds || !Array.isArray(affirmationIds) || affirmationIds.length === 0) {
      return NextResponse.json({ error: 'Affirmation IDs are required' }, { status: 400 });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('affirmations')
      .delete()
      .in('id', affirmationIds);

    if (deleteError) {
      console.error('Error deleting affirmations:', deleteError);
      return NextResponse.json({ error: 'Failed to delete affirmations' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully deleted ${affirmationIds.length} affirmation(s)`,
      deletedCount: affirmationIds.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







