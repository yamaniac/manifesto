'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, Heart, MessageSquare, Filter, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AffirmationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [affirmations, setAffirmations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredAffirmations, setFilteredAffirmations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAffirmation, setEditingAffirmation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    text: '',
    category_id: 'none'
  });

  const supabase = createClient();

  // Load affirmations and categories on component mount
  useEffect(() => {
    if (user) {
      loadAffirmations();
      loadCategories();
    }
  }, [user]);

  // Filter affirmations when category filter changes
  useEffect(() => {
    filterAffirmations();
  }, [affirmations, selectedCategory]);

  const loadAffirmations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('affirmations')
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffirmations(data || []);
    } catch (error) {
      console.error('Error loading affirmations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterAffirmations = () => {
    if (selectedCategory === 'all') {
      setFilteredAffirmations(affirmations);
    } else if (selectedCategory === 'uncategorized') {
      setFilteredAffirmations(affirmations.filter(a => !a.category_id));
    } else {
      setFilteredAffirmations(affirmations.filter(a => a.category_id === selectedCategory));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      alert('Affirmation text is required');
      return;
    }

    if (formData.text.length > 100) {
      alert('Affirmation text must be 100 characters or less');
      return;
    }

    try {
      if (editingAffirmation) {
        // Update existing affirmation
        const { error } = await supabase
          .from('affirmations')
          .update({
            text: formData.text.trim(),
            category_id: formData.category_id === 'none' ? null : formData.category_id || null
          })
          .eq('id', editingAffirmation.id);

        if (error) throw error;
      } else {
        // Create new affirmation
        const { error } = await supabase
          .from('affirmations')
          .insert({
            text: formData.text.trim(),
            category_id: formData.category_id === 'none' ? null : formData.category_id || null,
            created_by: user.id
          });

        if (error) throw error;
      }

      // Reset form and reload affirmations
      setFormData({ text: '', category_id: 'none' });
      setEditingAffirmation(null);
      setIsDialogOpen(false);
      loadAffirmations();
    } catch (error) {
      console.error('Error saving affirmation:', error);
      alert('Error saving affirmation: ' + error.message);
    }
  };

  const handleEdit = (affirmation) => {
    setEditingAffirmation(affirmation);
    setFormData({
      text: affirmation.text,
      category_id: affirmation.category_id || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (affirmationId) => {
    if (!confirm('Are you sure you want to delete this affirmation? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('affirmations')
        .delete()
        .eq('id', affirmationId);

      if (error) throw error;
      loadAffirmations();
    } catch (error) {
      console.error('Error deleting affirmation:', error);
      alert('Error deleting affirmation: ' + error.message);
    }
  };

  const toggleFavorite = async (affirmation) => {
    try {
      const { error } = await supabase
        .from('affirmations')
        .update({ is_favorite: !affirmation.is_favorite })
        .eq('id', affirmation.id);

      if (error) throw error;
      loadAffirmations();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const resetForm = () => {
    setFormData({ text: '', category_id: 'none' });
    setEditingAffirmation(null);
  };

  const getCharacterCount = () => formData.text.length;
  const isOverLimit = () => getCharacterCount() > 100;

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please log in to manage your affirmations.
                </p>
                <Button onClick={() => router.push('/login')}>
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-purple-500" />
              My Affirmations
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and organize your daily affirmations
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Affirmation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAffirmation ? 'Edit Affirmation' : 'Create New Affirmation'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAffirmation 
                      ? 'Update your affirmation below.' 
                      : 'Add a new positive affirmation (max 100 characters).'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="text">Affirmation Text</Label>
                    <div className="relative">
                      <Input
                        id="text"
                        value={formData.text}
                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                        placeholder="I am confident and capable..."
                        required
                        className={isOverLimit() ? 'border-destructive' : ''}
                      />
                      <div className={`text-xs mt-1 ${isOverLimit() ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {getCharacterCount()}/100 characters
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isOverLimit() || !formData.text.trim()}
                    >
                      {editingAffirmation ? 'Update Affirmation' : 'Create Affirmation'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Filter by Category:</Label>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Affirmations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Your Affirmations ({filteredAffirmations.length})
            </CardTitle>
            <CardDescription>
              Manage your personal affirmations and positive thoughts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAffirmations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedCategory === 'all' ? 'No affirmations yet' : 'No affirmations in this category'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedCategory === 'all' 
                    ? 'Start building your collection of positive affirmations.'
                    : 'Try selecting a different category or create a new affirmation.'
                  }
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Affirmation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affirmation</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffirmations.map((affirmation) => (
                    <TableRow key={affirmation.id}>
                      <TableCell className="max-w-md">
                        <div className="flex items-start gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFavorite(affirmation)}
                            className="p-1 h-6 w-6"
                          >
                            {affirmation.is_favorite ? (
                              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                            ) : (
                              <Heart className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-relaxed">
                              {affirmation.text}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                              {affirmation.text.length}/100 characters
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {affirmation.categories ? (
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: affirmation.categories.color + '20',
                              borderColor: affirmation.categories.color,
                              color: affirmation.categories.color
                            }}
                          >
                            {affirmation.categories.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Uncategorized</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(affirmation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(affirmation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(affirmation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
