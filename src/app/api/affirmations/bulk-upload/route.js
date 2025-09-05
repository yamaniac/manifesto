import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/affirmations/bulk-upload - Bulk upload affirmations from JSON
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
    const { affirmations, createMissingCategories = false } = body;

    console.log('Bulk upload received:', { 
      affirmationsCount: affirmations?.length, 
      createMissingCategories,
      firstAffirmation: affirmations?.[0]
    });

    // Validate input
    if (!affirmations || !Array.isArray(affirmations)) {
      console.log('Validation failed: affirmations is not an array', { affirmations });
      return NextResponse.json({ error: 'Affirmations array is required' }, { status: 400 });
    }

    if (affirmations.length === 0) {
      return NextResponse.json({ error: 'At least one affirmation is required' }, { status: 400 });
    }

    // Validate each affirmation
    const validationErrors = [];
    const processedAffirmations = [];

    for (let i = 0; i < affirmations.length; i++) {
      const affirmation = affirmations[i];
      const errors = [];

      console.log(`Validating affirmation ${i + 1}:`, affirmation);

      if (!affirmation.text || !affirmation.text.trim()) {
        errors.push('Text is required');
      }

      if (!affirmation.category || !affirmation.category.trim()) {
        errors.push('Category is required');
      }

      if (errors.length > 0) {
        console.log(`Validation errors for row ${i + 1}:`, errors);
        validationErrors.push(`Row ${i + 1}: ${errors.join(', ')}`);
      } else {
        processedAffirmations.push({
          text: affirmation.text.trim(),
          category: affirmation.category.trim(),
          image_id: affirmation.image_id || null
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }

    // Get all unique categories
    const uniqueCategories = [...new Set(processedAffirmations.map(a => a.category))];
    
    // Fetch existing categories
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .in('name', uniqueCategories);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const existingCategoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));
    const missingCategories = uniqueCategories.filter(
      cat => !existingCategoryMap.has(cat.toLowerCase())
    );

    // Handle missing categories
    if (missingCategories.length > 0) {
      if (!createMissingCategories) {
        return NextResponse.json({ 
          error: 'Missing categories found', 
          missingCategories,
          message: 'Set createMissingCategories to true to automatically create missing categories'
        }, { status: 400 });
      }

      // Create missing categories
      const categoriesToCreate = missingCategories.map(categoryName => ({
        name: categoryName,
        description: `Auto-created category for bulk upload`,
        color: '#3B82F6',
        created_by: user.id
      }));

      const { data: newCategories, error: createError } = await supabase
        .from('categories')
        .insert(categoriesToCreate)
        .select('id, name');

      if (createError) {
        console.error('Error creating categories:', createError);
        return NextResponse.json({ error: 'Failed to create missing categories' }, { status: 500 });
      }

      // Add new categories to the map
      newCategories.forEach(cat => {
        existingCategoryMap.set(cat.name.toLowerCase(), cat.id);
      });
    }

    // Prepare affirmations for insertion
    const affirmationsToInsert = processedAffirmations.map(affirmation => ({
      text: affirmation.text,
      category_id: existingCategoryMap.get(affirmation.category.toLowerCase()),
      image_id: affirmation.image_id,
      created_by: user.id
    }));

    // Insert affirmations
    const { data: insertedAffirmations, error: insertError } = await supabase
      .from('affirmations')
      .insert(affirmationsToInsert)
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
      `);

    if (insertError) {
      console.error('Error inserting affirmations:', insertError);
      return NextResponse.json({ error: 'Failed to insert affirmations' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully uploaded ${insertedAffirmations.length} affirmations`,
      data: insertedAffirmations,
      createdCategories: missingCategories.length,
      stats: {
        total: processedAffirmations.length,
        inserted: insertedAffirmations.length,
        categoriesCreated: missingCategories.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
