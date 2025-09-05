import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/affirmations/export - Export affirmations as JSON
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
    const format = searchParams.get('format') || 'json'; // json or csv

    // Build query
    let query = supabase
      .from('affirmations')
      .select(`
        text,
        categories (
          name,
          color,
          description
        ),
        images (
          filename,
          file_url,
          original_filename
        )
      `)
      .order('created_at', { ascending: false });

    // Apply category filter if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: affirmations, error } = await query;

    if (error) {
      console.error('Error fetching affirmations for export:', error);
      return NextResponse.json({ error: 'Failed to fetch affirmations' }, { status: 500 });
    }

    // Format data for export
    const exportData = affirmations.map(affirmation => ({
      text: affirmation.text,
      category: affirmation.categories?.name || 'Unknown',
      categoryColor: affirmation.categories?.color || '#3B82F6',
      categoryDescription: affirmation.categories?.description || '',
      image: affirmation.images ? {
        filename: affirmation.images.filename,
        url: affirmation.images.file_url,
        originalFilename: affirmation.images.original_filename
      } : null
    }));

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['text', 'category', 'categoryColor', 'categoryDescription', 'imageFilename', 'imageUrl'];
      const csvRows = [headers.join(',')];
      
      exportData.forEach(row => {
        const values = [
          `"${row.text.replace(/"/g, '""')}"`,
          `"${row.category}"`,
          `"${row.categoryColor}"`,
          `"${row.categoryDescription}"`,
          `"${row.image?.filename || ''}"`,
          `"${row.image?.url || ''}"`
        ];
        csvRows.push(values.join(','));
      });

      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="affirmations.csv"'
        }
      });
    } else {
      // Return as JSON
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalCount: exportData.length,
        data: exportData
      }, {
        headers: {
          'Content-Disposition': 'attachment; filename="affirmations.json"'
        }
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
