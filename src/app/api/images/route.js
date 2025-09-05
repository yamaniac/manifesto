import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/images - Fetch uploaded images with optional filtering
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
      .from('images')
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`original_filename.ilike.%${search}%,filename.ilike.%${search}%`);
    }

    const { data: images, error, count } = await query;

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('images')
      .select('*', { count: 'exact', head: true });

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId);
    }

    if (search) {
      countQuery = countQuery.or(`original_filename.ilike.%${search}%,filename.ilike.%${search}%`);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      data: images || [],
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

// DELETE /api/images - Delete multiple images
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

    const { imageIds } = await request.json();

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs are required' }, { status: 400 });
    }

    // Get image records to delete from storage
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('file_path')
      .in('id', imageIds);

    if (fetchError) {
      console.error('Error fetching images for deletion:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .in('id', imageIds);

    if (deleteError) {
      console.error('Error deleting images from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
    }

    // Delete from storage (optional - files will be cleaned up by storage policies)
    // Note: In production, you might want to implement proper cleanup

    return NextResponse.json({
      message: `Successfully deleted ${imageIds.length} image(s)`,
      deletedCount: imageIds.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
