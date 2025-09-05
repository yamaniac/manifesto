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
import { ArrowLeft, Plus, Edit, Trash2, Heart, MessageSquare, Filter, Star, Image, RefreshCw, Lock, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import imageCompression from 'browser-image-compression';

export default function AffirmationsPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
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
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [selectedAffirmations, setSelectedAffirmations] = useState(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, image: null });
  const [uploadModal, setUploadModal] = useState({ isOpen: false, affirmation: null, file: null, preview: null });
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [generalImageUploads, setGeneralImageUploads] = useState([]);
  const [isGeneralUploading, setIsGeneralUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
    
    // For general category, handle image uploads instead of text
    if (isGeneralCategorySelected()) {
      await uploadGeneralImages();
      return;
    }
    
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
      // Update local state instead of reloading everything
      updateAffirmationInState(affirmation.id, { is_favorite: !affirmation.is_favorite });
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const fetchAndStoreImage = async (affirmation) => {
    if (!affirmation.categories?.name) {
      showToast('Please select a category for this affirmation to fetch an image', 'info');
      return;
    }

    setIsImageLoading(true);
    try {
      const response = await fetch('/api/affirmations/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          affirmationId: affirmation.id,
          categoryName: affirmation.categories.name,
          affirmationText: affirmation.text
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch image');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the affirmation in local state with the new image
        updateAffirmationInState(affirmation.id, {
          image_url: result.image.url,
          image_alt_text: result.image.alt_text
        });
        showToast('Image successfully added!', 'success');
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      showToast('Error fetching image: ' + error.message, 'error');
    } finally {
      setIsImageLoading(false);
    }
  };

  const toggleAffirmationSelection = (affirmationId) => {
    const newSelected = new Set(selectedAffirmations);
    if (newSelected.has(affirmationId)) {
      newSelected.delete(affirmationId);
    } else {
      newSelected.add(affirmationId);
    }
    setSelectedAffirmations(newSelected);
  };

  const selectAllAffirmations = () => {
    const allIds = filteredAffirmations.map(a => a.id);
    setSelectedAffirmations(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedAffirmations(new Set());
  };

  const updateAffirmationInState = (affirmationId, updates) => {
    setAffirmations(prev => prev.map(aff => 
      aff.id === affirmationId ? { ...aff, ...updates } : aff
    ));
  };

  const bulkFetchImages = async () => {
    if (selectedAffirmations.size === 0) {
      showToast('Please select affirmations to fetch images for', 'info');
      return;
    }

    const selectedAffirmationsList = filteredAffirmations.filter(a => selectedAffirmations.has(a.id));
    const affirmationsWithCategories = selectedAffirmationsList.filter(a => a.categories?.name);
    const affirmationsWithoutCategories = selectedAffirmationsList.filter(a => !a.categories?.name);

    if (affirmationsWithoutCategories.length > 0) {
      const names = affirmationsWithoutCategories.map(a => a.text.substring(0, 30) + '...').join(', ');
      showToast(`${affirmationsWithoutCategories.length} affirmations don't have categories and will be skipped: ${names}`, 'info');
    }

    if (affirmationsWithCategories.length === 0) {
      showToast('No selected affirmations have categories assigned', 'info');
      return;
    }

    setIsBulkLoading(true);
    showToast(`Starting bulk image fetch for ${affirmationsWithCategories.length} affirmations...`, 'info');
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const affirmation of affirmationsWithCategories) {
        try {
          const response = await fetch('/api/affirmations/images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              affirmationId: affirmation.id,
              categoryName: affirmation.categories.name,
              affirmationText: affirmation.text
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to fetch image for affirmation ${affirmation.id}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error fetching image for affirmation ${affirmation.id}:`, error);
        }
      }

      // Reload affirmations to show all new images
      await loadAffirmations();
      
      // Clear selection after bulk operation
      setSelectedAffirmations(new Set());
      
      // Show success toast
      showToast(`Bulk image fetch completed! ✅ ${successCount} successful, ❌ ${errorCount} errors`, 'success');
    } catch (error) {
      console.error('Error in bulk image fetch:', error);
      showToast('Error in bulk image fetch: ' + error.message, 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ text: '', category_id: 'none' });
    setEditingAffirmation(null);
    setGeneralImageUploads([]);
  };

  const openImageModal = (imageUrl, altText) => {
    setImageModal({
      isOpen: true,
      image: { url: imageUrl, alt: altText }
    });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, image: null });
  };

  const openUploadModal = (affirmation) => {
    setUploadModal({
      isOpen: true,
      affirmation: affirmation,
      file: null,
      preview: null
    });
  };

  const closeUploadModal = () => {
    setUploadModal({
      isOpen: false,
      affirmation: null,
      file: null,
      preview: null
    });
    setIsCompressing(false);
    setCompressionProgress(0);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('File size must be less than 5MB', 'error');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }

      setIsCompressing(true);
      setCompressionProgress(0);

      try {
        // Compress the image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1, // Maximum file size in MB
          maxWidthOrHeight: 1920, // Maximum width or height
          useWebWorker: true,
          onProgress: (progress) => {
            setCompressionProgress(Math.round(progress));
          }
        });

        // Create preview from compressed file
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadModal(prev => ({
            ...prev,
            file: compressedFile,
            preview: e.target.result
          }));
          setIsCompressing(false);
          setCompressionProgress(0);
          
          // Show compression info
          const originalSize = (file.size / 1024 / 1024).toFixed(2);
          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
          const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
          showToast(`Image compressed: ${originalSize}MB → ${compressedSize}MB (${savings}% smaller)`, 'success');
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        showToast('Error compressing image: ' + error.message, 'error');
        setIsCompressing(false);
        setCompressionProgress(0);
      }
    }
  };

  const uploadManualImage = async () => {
    if (!uploadModal.file || !uploadModal.affirmation) {
      showToast('Please select an image file', 'error');
      return;
    }

    try {
      // Create a unique filename
      const fileExt = uploadModal.file.name.split('.').pop();
      const fileName = `manual_${uploadModal.affirmation.id}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage directly with the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('affirmation-images')
        .upload(fileName, uploadModal.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('affirmation-images')
        .getPublicUrl(fileName);

      // Update affirmation with manual image
      const { error: updateError } = await supabase
        .from('affirmations')
        .update({
          image_url: urlData.publicUrl,
          image_alt_text: `Manual upload: ${uploadModal.affirmation.text}`,
          is_manual_image: true
        })
        .eq('id', uploadModal.affirmation.id);

      if (updateError) throw updateError;

      // Update local state
      updateAffirmationInState(uploadModal.affirmation.id, {
        image_url: urlData.publicUrl,
        image_alt_text: `Manual upload: ${uploadModal.affirmation.text}`,
        is_manual_image: true
      });

      showToast('Image uploaded successfully!', 'success');
      closeUploadModal();
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Error uploading image: ' + error.message, 'error');
    }
  };

  const deleteManualImage = async (affirmation) => {
    if (!confirm('Are you sure you want to delete this manually uploaded image? This action cannot be undone.')) {
      return;
    }

    try {
      // Update affirmation to remove image
      const { error: updateError } = await supabase
        .from('affirmations')
        .update({
          image_url: null,
          image_alt_text: null,
          is_manual_image: false
        })
        .eq('id', affirmation.id);

      if (updateError) throw updateError;

      // Update local state
      updateAffirmationInState(affirmation.id, {
        image_url: null,
        image_alt_text: null,
        is_manual_image: false
      });

      showToast('Image deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Error deleting image: ' + error.message, 'error');
    }
  };

  const isManualImage = (affirmation) => {
    return affirmation.is_manual_image === true;
  };

  const getCharacterCount = () => formData.text.length;
  const isOverLimit = () => getCharacterCount() > 100;

  // Check if general category is selected
  const isGeneralCategorySelected = () => {
    const generalCategory = categories.find(cat => cat.name.toLowerCase() === 'general');
    return generalCategory && formData.category_id === generalCategory.id;
  };

  // Handle drag and drop for general category
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleMultipleFileSelect(e.dataTransfer.files);
    }
  };

  // Handle multiple file selection for general category
  const handleMultipleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showToast('Please select image files only', 'error');
      return;
    }

    if (imageFiles.length !== fileArray.length) {
      showToast(`${fileArray.length - imageFiles.length} non-image files were ignored`, 'info');
    }

    const newUploads = [];
    
    for (const file of imageFiles) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast(`File ${file.name} is too large (max 5MB)`, 'error');
        continue;
      }

      try {
        // Compress the image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const uploadItem = {
            id: Date.now() + Math.random(),
            file: compressedFile,
            preview: e.target.result,
            name: file.name,
            size: compressedFile.size
          };
          
          setGeneralImageUploads(prev => [...prev, uploadItem]);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        showToast(`Error compressing ${file.name}: ${error.message}`, 'error');
      }
    }
  };

  // Remove uploaded file from general category
  const removeGeneralUpload = (uploadId) => {
    setGeneralImageUploads(prev => prev.filter(item => item.id !== uploadId));
  };

  // Upload all general category images
  const uploadGeneralImages = async () => {
    if (generalImageUploads.length === 0) {
      showToast('Please select images to upload', 'error');
      return;
    }

    setIsGeneralUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const uploadItem of generalImageUploads) {
        try {
          // Create a unique filename
          const fileExt = uploadItem.file.name.split('.').pop();
          const fileName = `general_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('affirmation-images')
            .upload(fileName, uploadItem.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('affirmation-images')
            .getPublicUrl(fileName);

          // Create affirmation entry for this image
          const { error: insertError } = await supabase
            .from('affirmations')
            .insert({
              text: `Image: ${uploadItem.name}`,
              category_id: formData.category_id,
              image_url: urlData.publicUrl,
              image_alt_text: `General category image: ${uploadItem.name}`,
              is_manual_image: true,
              created_by: user.id
            });

          if (insertError) throw insertError;
          
          successCount++;
        } catch (error) {
          console.error(`Error uploading ${uploadItem.name}:`, error);
          errorCount++;
        }
      }

      // Clear uploads and reload affirmations
      setGeneralImageUploads([]);
      await loadAffirmations();
      
      showToast(`Upload completed! ✅ ${successCount} successful, ❌ ${errorCount} errors`, 'success');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error in general image upload:', error);
      showToast('Error uploading images: ' + error.message, 'error');
    } finally {
      setIsGeneralUploading(false);
    }
  };

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

  // Check if user has super admin access
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-4">
                  You need super admin privileges to manage affirmations.
                </p>
                <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Admin
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
              Affirmations Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Super Admin: Create and organize system affirmations
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
              <DialogContent className={isGeneralCategorySelected() ? "max-w-4xl" : ""}>
                <DialogHeader>
                  <DialogTitle>
                    {isGeneralCategorySelected() 
                      ? 'Upload Images to General Category' 
                      : editingAffirmation ? 'Edit Affirmation' : 'Create New Affirmation'
                    }
                  </DialogTitle>
                  <DialogDescription>
                    {isGeneralCategorySelected() 
                      ? 'Drag and drop multiple images or click to select files. Each image will be added as a separate affirmation entry.'
                      : editingAffirmation 
                        ? 'Update your affirmation below.' 
                        : 'Add a new positive affirmation (max 100 characters).'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isGeneralCategorySelected() ? (
                    // General category image upload interface
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
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
                      
                      {/* Drag and Drop Area */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          dragActive 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Drop images here or click to select
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Supports JPG, PNG, WebP, GIF (max 5MB each)
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleMultipleFileSelect(e.target.files)}
                          className="hidden"
                          id="general-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('general-image-upload').click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Select Images
                        </Button>
                      </div>

                      {/* Image Previews */}
                      {generalImageUploads.length > 0 && (
                        <div>
                          <Label>Selected Images ({generalImageUploads.length})</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                            {generalImageUploads.map((uploadItem) => (
                              <div key={uploadItem.id} className="relative group">
                                <img
                                  src={uploadItem.preview}
                                  alt={uploadItem.name}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeGeneralUpload(uploadItem.id)}
                                  className="absolute top-1 right-1 p-1 h-6 w-6 bg-red-100 border border-red-200 rounded-full shadow-sm hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3 text-red-600" />
                                </Button>
                                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
                                  <p className="truncate">{uploadItem.name}</p>
                                  <p>{(uploadItem.size / 1024 / 1024).toFixed(2)}MB</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular affirmation form
                    <>
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
                    </>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={
                        isGeneralCategorySelected() 
                          ? generalImageUploads.length === 0 || isGeneralUploading
                          : isOverLimit() || !formData.text.trim()
                      }
                    >
                      {isGeneralCategorySelected() ? (
                        isGeneralUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading Images...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload {generalImageUploads.length} Image{generalImageUploads.length !== 1 ? 's' : ''}
                          </>
                        )
                      ) : (
                        editingAffirmation ? 'Update Affirmation' : 'Create Affirmation'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isGeneralUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
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

        {/* Bulk Operations */}
        {filteredAffirmations.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAffirmations.size === filteredAffirmations.length && filteredAffirmations.length > 0}
                      onChange={selectAllAffirmations}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label className="text-sm font-medium">
                      Select All ({selectedAffirmations.size}/{filteredAffirmations.length})
                    </Label>
                  </div>
                  {selectedAffirmations.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                {selectedAffirmations.size > 0 && (
                  <Button
                    onClick={bulkFetchImages}
                    disabled={isBulkLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isBulkLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Fetching Images...
                      </>
                    ) : (
                      <>
                        <Image className="mr-2 h-4 w-4" />
                        Bulk Fetch Images ({selectedAffirmations.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
              {selectedAffirmations.size > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>📋 <strong>{selectedAffirmations.size}</strong> affirmations selected</p>
                  <p>🎯 Only affirmations with categories will get images</p>
                  <p>⏱️ This may take a few moments for large selections</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedAffirmations.size === filteredAffirmations.length && filteredAffirmations.length > 0}
                        onChange={selectAllAffirmations}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Affirmation</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffirmations.map((affirmation) => (
                    <TableRow 
                      key={affirmation.id}
                      className={selectedAffirmations.has(affirmation.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                    >
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedAffirmations.has(affirmation.id)}
                          onChange={() => toggleAffirmationSelection(affirmation.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <div className="flex flex-col items-center gap-2">
                          {affirmation.image_url ? (
                            <div className="relative">
                              <img
                                src={affirmation.image_url}
                                alt={affirmation.image_alt_text || 'Affirmation image'}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openImageModal(affirmation.image_url, affirmation.image_alt_text)}
                                title="Click to view full size"
                              />
                              {isManualImage(affirmation) ? (
                                <div className="absolute -top-2 -right-2 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteManualImage(affirmation)}
                                    className="p-1 h-6 w-6 bg-red-100 border border-red-200 rounded-full shadow-sm hover:bg-red-200"
                                    title="Delete manual image"
                                  >
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => fetchAndStoreImage(affirmation)}
                                  className="absolute -top-2 -right-2 p-1 h-6 w-6 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                                  title="Refresh image"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          {!affirmation.image_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchAndStoreImage(affirmation)}
                              disabled={isImageLoading || !affirmation.categories?.name}
                              className="text-xs"
                            >
                              {isImageLoading ? (
                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Image className="h-3 w-3 mr-1" />
                              )}
                              Add Image
                            </Button>
                          )}
                          {/* Upload icon - always visible */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openUploadModal(affirmation)}
                            className="p-1 h-6 w-6 bg-blue-100 border border-blue-200 rounded-full shadow-sm hover:bg-blue-200"
                            title="Upload custom image"
                          >
                            <Upload className="h-3 w-3 text-blue-600" />
                          </Button>
                        </div>
                      </TableCell>
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

        {/* Image Modal */}
        <Dialog open={imageModal.isOpen} onOpenChange={closeImageModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Affirmation Image</DialogTitle>
              <DialogDescription>
                {imageModal.image?.alt || 'View your affirmation image in full size'}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              {imageModal.image && (
                <div className="relative">
                  <img
                    src={imageModal.image.url}
                    alt={imageModal.image.alt}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Click outside or press ESC to close</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={closeImageModal}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Modal */}
        <Dialog open={uploadModal.isOpen} onOpenChange={closeUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Custom Image</DialogTitle>
              <DialogDescription>
                Upload a custom image for: "{uploadModal.affirmation?.text}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Select Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-2"
                  disabled={isCompressing}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size: 5MB. Images will be automatically compressed to 1MB max with 1920px max resolution.
                </p>
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>Compression Settings:</strong><br/>
                    • Max file size: 1MB<br/>
                    • Max resolution: 1920px (width or height)<br/>
                    • Quality: Optimized for web display<br/>
                    • Formats: JPG, PNG, WebP, GIF
                  </p>
                </div>
                {isCompressing && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Compressing image... {compressionProgress}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${compressionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {uploadModal.preview && (
                <div>
                  <Label>Preview</Label>
                  <div className="mt-2 relative">
                    <img
                      src={uploadModal.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUploadModal(prev => ({ ...prev, file: null, preview: null }))}
                      className="absolute top-2 right-2 p-1 h-6 w-6 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {uploadModal.file && (
                    <div className="mt-2 p-2 bg-green-50 rounded-md">
                      <p className="text-xs text-green-700">
                        <strong>Ready to upload:</strong><br/>
                        File size: {(uploadModal.file.size / 1024 / 1024).toFixed(2)}MB<br/>
                        Type: {uploadModal.file.type}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={uploadManualImage}
                  disabled={!uploadModal.file || isCompressing}
                  className="flex-1"
                >
                  {isCompressing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeUploadModal}
                  disabled={isCompressing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
}
