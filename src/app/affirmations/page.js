'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Plus, Search, Upload, Download, Edit, Trash2, Image as ImageIcon, Filter, RefreshCw, ArrowLeft, Lock, MessageSquare, X } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

export default function AffirmationsPage() {
  const { user, isSuperAdmin, signOut } = useAuth();
  const router = useRouter();
  const [affirmations, setAffirmations] = useState([]);
  const [allAffirmations, setAllAffirmations] = useState([]); // Unfiltered affirmations for counts
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAffirmations, setSelectedAffirmations] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [editingAffirmation, setEditingAffirmation] = useState(null);
  const [bulkUploadData, setBulkUploadData] = useState('');
  const [createMissingCategories, setCreateMissingCategories] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [bulkUploadCategory, setBulkUploadCategory] = useState('');
  const [isImageSelectDialogOpen, setIsImageSelectDialogOpen] = useState(false);
  const [selectedAffirmationForImage, setSelectedAffirmationForImage] = useState(null);
  const [isBulkImageAssigning, setIsBulkImageAssigning] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    text: '',
    category_id: '',
    image_id: ''
  });

  // Show message with auto-hide
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  // Fetch affirmations
  const fetchAffirmations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category_id', selectedCategory);

      const response = await fetch(`/api/affirmations?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch affirmations');
      }
      
      setAffirmations(result.data || []);
    } catch (error) {
      console.error('Error fetching affirmations:', error);
      showMessage('error', 'Error fetching affirmations: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, showMessage]);

  // Fetch all affirmations (unfiltered) for category counts
  const fetchAllAffirmations = useCallback(async () => {
    try {
      const response = await fetch('/api/affirmations');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch all affirmations');
      }
      
      setAllAffirmations(result.data || []);
    } catch (error) {
      console.error('Error fetching all affirmations:', error);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories');
      }
      
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('error', 'Error fetching categories: ' + error.message);
    }
  }, [showMessage]);

  // Fetch images
  const fetchImages = useCallback(async (categoryId = '') => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId);

      const response = await fetch(`/api/images?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch images');
      }
      
      setImages(result.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      showMessage('error', 'Error fetching images: ' + error.message);
    }
  }, [showMessage]);

  // Load data on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchAffirmations();
      fetchAllAffirmations();
      fetchCategories();
      fetchImages();
    }
  }, [isSuperAdmin, fetchAffirmations, fetchAllAffirmations, fetchCategories, fetchImages]);

  // Refetch when filters change
  useEffect(() => {
    if (isSuperAdmin) {
      fetchAffirmations();
    }
  }, [isSuperAdmin, fetchAffirmations]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim() || !formData.category_id) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      const url = editingAffirmation ? `/api/affirmations/${editingAffirmation.id}` : '/api/affirmations';
      const method = editingAffirmation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save affirmation');
      }

      showMessage('success', `Affirmation ${editingAffirmation ? 'updated' : 'created'} successfully`);
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingAffirmation(null);
      setFormData({ text: '', category_id: '', image_id: '' });
      fetchAffirmations();
      fetchAllAffirmations();
    } catch (error) {
      console.error('Error saving affirmation:', error);
      showMessage('error', 'Error saving affirmation: ' + error.message);
    }
  };

  // Handle edit
  const handleEdit = (affirmation) => {
    setEditingAffirmation(affirmation);
    setFormData({
      text: affirmation.text,
      category_id: affirmation.category_id,
      image_id: affirmation.image_id || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (affirmationId) => {
    if (!confirm('Are you sure you want to delete this affirmation?')) return;

    try {
      const response = await fetch(`/api/affirmations/${affirmationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete affirmation');
      }

      showMessage('success', 'Affirmation deleted successfully');
      fetchAffirmations();
      fetchAllAffirmations();
    } catch (error) {
      console.error('Error deleting affirmation:', error);
      showMessage('error', 'Error deleting affirmation: ' + error.message);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedAffirmations.length === 0) {
      showMessage('error', 'Please select affirmations to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedAffirmations.length} affirmation(s)?`)) return;

    try {
      const response = await fetch('/api/affirmations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affirmationIds: selectedAffirmations })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete affirmations');
      }

      showMessage('success', `Successfully deleted ${selectedAffirmations.length} affirmation(s)`);
      setSelectedAffirmations([]);
      fetchAffirmations();
      fetchAllAffirmations();
    } catch (error) {
      console.error('Error deleting affirmations:', error);
      showMessage('error', 'Error deleting affirmations: ' + error.message);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showMessage('error', 'Please select a JSON file');
      return;
    }

    setIsProcessingFile(true);
    try {
      const text = await file.text();
      const affirmations = JSON.parse(text);
      
      if (!Array.isArray(affirmations)) {
        throw new Error('JSON file must contain an array of affirmations');
      }

      setBulkUploadData(JSON.stringify(affirmations, null, 2));
      setUploadedFile(file);
      setBulkUploadCategory(''); // Reset category selection when new file is loaded
      showMessage('success', `File "${file.name}" loaded successfully`);
    } catch (error) {
      console.error('Error processing file:', error);
      showMessage('error', 'Error processing file: ' + error.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!bulkUploadData.trim()) {
      showMessage('error', 'Please enter JSON data or upload a file');
      return;
    }

    if (!bulkUploadCategory) {
      showMessage('error', 'Please select a target category for the upload');
      return;
    }

    try {
      let affirmations;
      try {
        affirmations = JSON.parse(bulkUploadData);
      } catch (parseError) {
        throw new Error('Invalid JSON format: ' + parseError.message);
      }
      
      // If not creating missing categories, map all affirmations to the selected category
      if (!createMissingCategories) {
        affirmations = affirmations.map(affirmation => ({
          ...affirmation,
          category: categories.find(c => c.id === bulkUploadCategory)?.name || affirmation.category
        }));
      }
      
      console.log('Uploading affirmations:', affirmations);
      console.log('Create missing categories:', createMissingCategories);
      console.log('Target category:', bulkUploadCategory);
      
      const response = await fetch('/api/affirmations/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          affirmations, 
          createMissingCategories 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          const errorDetails = result.details.join('\n');
          throw new Error(`${result.error}\n\nDetails:\n${errorDetails}`);
        }
        throw new Error(result.error || 'Failed to upload affirmations');
      }

      showMessage('success', `Successfully uploaded ${result.stats.inserted} affirmations`);
      setBulkUploadData('');
      setUploadedFile(null);
      setBulkUploadCategory('');
      setIsBulkUploadDialogOpen(false);
      fetchAffirmations();
      fetchAllAffirmations();
    } catch (error) {
      console.error('Error uploading affirmations:', error);
      showMessage('error', 'Error uploading affirmations: ' + error.message);
    }
  };

  // Handle export
  const handleExport = async (format = 'json') => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      params.append('format', format);

      const response = await fetch(`/api/affirmations/export?${params}`);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to export affirmations');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affirmations.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showMessage('success', 'Affirmations exported successfully');
    } catch (error) {
      console.error('Error exporting affirmations:', error);
      showMessage('error', 'Error exporting affirmations: ' + error.message);
    }
  };

  // Handle category change for image filtering
  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({ ...prev, category_id: categoryId, image_id: '' }));
    fetchImages(categoryId);
  };

  // Toggle selection
  const toggleSelection = (affirmationId) => {
    setSelectedAffirmations(prev => 
      prev.includes(affirmationId) 
        ? prev.filter(id => id !== affirmationId)
        : [...prev, affirmationId]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedAffirmations(affirmations.map(a => a.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedAffirmations([]);
  };

  // Handle image selection for affirmation
  const handleImageSelect = (affirmation) => {
    setSelectedAffirmationForImage(affirmation);
    fetchImages(affirmation.category_id);
    setIsImageSelectDialogOpen(true);
  };

  // Assign image to affirmation
  const assignImageToAffirmation = async (imageId) => {
    if (!selectedAffirmationForImage) return;

    try {
      const response = await fetch(`/api/affirmations/${selectedAffirmationForImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedAffirmationForImage.text,
          category_id: selectedAffirmationForImage.category_id,
          image_id: imageId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign image');
      }

      showMessage('success', 'Image assigned successfully');
      setIsImageSelectDialogOpen(false);
      setSelectedAffirmationForImage(null);
      fetchAffirmations();
    } catch (error) {
      console.error('Error assigning image:', error);
      showMessage('error', 'Error assigning image: ' + error.message);
    }
  };

  // Remove image from affirmation
  const removeImageFromAffirmation = async (affirmation) => {
    if (!affirmation) return;

    try {
      const response = await fetch(`/api/affirmations/${affirmation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: affirmation.text,
          category_id: affirmation.category_id,
          image_id: null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove image');
      }

      showMessage('success', 'Image removed successfully');
      fetchAffirmations();
      fetchAllAffirmations();
    } catch (error) {
      console.error('Error removing image:', error);
      showMessage('error', 'Error removing image: ' + error.message);
    }
  };

  // Bulk assign images to selected affirmations
  const handleBulkImageAssignment = async () => {
    if (selectedAffirmations.length === 0) {
      showMessage('error', 'Please select affirmations to assign images to');
      return;
    }

    // Filter affirmations that don't have images
    const affirmationsWithoutImages = affirmations.filter(affirmation => 
      selectedAffirmations.includes(affirmation.id) && !affirmation.images
    );

    if (affirmationsWithoutImages.length === 0) {
      showMessage('info', 'All selected affirmations already have images assigned');
      return;
    }

    setIsBulkImageAssigning(true);
    
    try {
      // Group affirmations by category
      const affirmationsByCategory = {};
      affirmationsWithoutImages.forEach(affirmation => {
        if (!affirmationsByCategory[affirmation.category_id]) {
          affirmationsByCategory[affirmation.category_id] = [];
        }
        affirmationsByCategory[affirmation.category_id].push(affirmation);
      });

      let totalAssigned = 0;
      let totalSkipped = 0;

      // Process each category
      for (const [categoryId, categoryAffirmations] of Object.entries(affirmationsByCategory)) {
        // Fetch available images for this category
        const response = await fetch(`/api/images?category_id=${categoryId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to fetch images for category ${categoryId}`);
        }

        const availableImages = result.data || [];
        
        if (availableImages.length === 0) {
          showMessage('warning', `No images available for category: ${categories.find(c => c.id === categoryId)?.name || 'Unknown'}`);
          totalSkipped += categoryAffirmations.length;
          continue;
        }

        // Shuffle images to ensure random assignment
        const shuffledImages = [...availableImages].sort(() => Math.random() - 0.5);
        
        // Assign unique images to affirmations
        for (let i = 0; i < categoryAffirmations.length; i++) {
          const affirmation = categoryAffirmations[i];
          const imageIndex = i % shuffledImages.length; // Cycle through images if there are more affirmations than images
          const image = shuffledImages[imageIndex];

          try {
            const updateResponse = await fetch(`/api/affirmations/${affirmation.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: affirmation.text,
                category_id: affirmation.category_id,
                image_id: image.id
              })
            });

            const updateResult = await updateResponse.json();

            if (!updateResponse.ok) {
              throw new Error(updateResult.error || 'Failed to assign image');
            }

            totalAssigned++;
          } catch (error) {
            console.error(`Error assigning image to affirmation ${affirmation.id}:`, error);
            totalSkipped++;
          }
        }
      }

      // Refresh data
      await fetchAffirmations();
      await fetchAllAffirmations();

      // Show results
      if (totalAssigned > 0) {
        showMessage('success', `Successfully assigned images to ${totalAssigned} affirmation(s)`);
      }
      if (totalSkipped > 0) {
        showMessage('warning', `${totalSkipped} affirmation(s) could not be assigned images`);
      }

      // Clear selection
      setSelectedAffirmations([]);

    } catch (error) {
      console.error('Error in bulk image assignment:', error);
      showMessage('error', 'Error assigning images: ' + error.message);
    } finally {
      setIsBulkImageAssigning(false);
    }
  };

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Required</h3>
                <p className="text-muted-foreground mb-4">
                  You need super admin privileges to manage affirmations.
                </p>
                <Button onClick={() => router.push('/')} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
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
              <MessageSquare className="h-8 w-8 text-blue-500" />
              Affirmations Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your affirmations, categories, and images
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Button>
            <Button onClick={() => signOut()} variant="destructive">
              <Lock className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkImageAssignment}
            disabled={isLoading || selectedAffirmations.length === 0 || isBulkImageAssigning}
          >
            {isBulkImageAssigning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Assigning Images...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Assign Images
              </>
            )}
          </Button>
          <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Upload Affirmations</DialogTitle>
                <DialogDescription>
                  Upload multiple affirmations from JSON format. Each affirmation should have 'text' and 'category' fields.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* File Upload Section */}
                <div>
                  <Label className="text-base font-medium">Upload JSON File</Label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={isProcessingFile}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isProcessingFile ? 'Processing file...' : 'Click to upload JSON file or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Supports .json files
                        </p>
                      </label>
                    </div>
                    {uploadedFile && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800 dark:text-green-200">
                            File loaded: {uploadedFile.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null);
                              setBulkUploadData('');
                            }}
                            className="ml-auto h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Manual JSON Input */}
                <div>
                  <Label htmlFor="bulkData">Paste JSON Data</Label>
                  <textarea
                    id="bulkData"
                    value={bulkUploadData}
                    onChange={(e) => setBulkUploadData(e.target.value)}
                    placeholder='[{"text": "I am worthy of success", "category": "Motivation"}, ...]'
                    className="w-full h-40 p-3 border rounded-md font-mono text-sm mt-2"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <Label htmlFor="bulkCategory">Target Category *</Label>
                  <Select
                    value={bulkUploadCategory}
                    onValueChange={setBulkUploadCategory}
                    required
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select target category for upload" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    All affirmations will be assigned to this category
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="createMissing"
                      checked={createMissingCategories}
                      onChange={(e) => setCreateMissingCategories(e.target.checked)}
                    />
                    <Label htmlFor="createMissing">Create missing categories automatically</Label>
                  </div>
                  {createMissingCategories && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ This will create new categories if they don't exist. Otherwise, all affirmations will be assigned to the selected category above.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsBulkUploadDialogOpen(false);
                      setBulkUploadData('');
                      setUploadedFile(null);
                      setBulkUploadCategory('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkUpload}
                    disabled={!bulkUploadData.trim() || !bulkUploadCategory || isProcessingFile}
                  >
                    {isProcessingFile ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Upload Affirmations'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Affirmation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Affirmation</DialogTitle>
                <DialogDescription>
                  Create a new affirmation and assign it to a category.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="text">Affirmation Text *</Label>
                  <Input
                    id="text"
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter affirmation text..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={handleCategoryChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="image">Image (Optional)</Label>
                  <Select
                    value={formData.image_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, image_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select image" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No image</SelectItem>
                      {images
                        .filter(img => img.category_id === formData.category_id)
                        .map(image => (
                          <SelectItem key={image.id} value={image.id}>
                            <div className="flex items-center gap-2">
                              <img
                                src={image.file_url}
                                alt={image.original_filename}
                                className="w-6 h-6 object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <ImageIcon className="h-4 w-4 hidden" />
                              <span className="truncate">{image.original_filename}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Two-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Pane - Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </CardTitle>
                <CardDescription>
                  Click a category to filter affirmations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedCategory === "" ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="font-medium">All Categories</span>
                      <Badge variant="outline" className="ml-auto">
                        {allAffirmations.length}
                      </Badge>
                    </div>
                  </button>
                  {categories.map((category) => {
                    // Always show the total count of affirmations in this category (unfiltered)
                    const categoryCount = allAffirmations.filter(a => a.category_id === category.id).length;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedCategory === category.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {categoryCount}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1 ml-5">
                            {category.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Affirmations */}
          <div className="lg:col-span-3 space-y-6">
            {/* Message Display */}
            {message.text && (
              <div className={`p-3 rounded-md flex items-center gap-2 ${
                message.type === 'error' 
                  ? 'text-red-600 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'text-green-600 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              }`}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            )}

            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search affirmations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchAffirmations}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedAffirmations.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedAffirmations.length} affirmation(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Affirmations List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Affirmations ({affirmations.length})
                    {selectedCategory && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        in {categories.find(c => c.id === selectedCategory)?.name}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={affirmations.length === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      disabled={selectedAffirmations.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                    <p className="mt-2 text-gray-500">Loading affirmations...</p>
                  </div>
                ) : affirmations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No affirmations found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || selectedCategory ? 'Try adjusting your search or category filter' : 'Get started by creating your first affirmation'}
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Affirmation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {affirmations.map((affirmation) => (
                      <div
                        key={affirmation.id}
                        className={`border rounded-lg p-4 space-y-3 ${
                          selectedAffirmations.includes(affirmation.id) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedAffirmations.includes(affirmation.id)}
                            onChange={() => toggleSelection(affirmation.id)}
                            className="mt-1"
                          />
                          
                          {/* Image Thumbnail or Placeholder */}
                          <div className="flex-shrink-0 relative group">
                            {affirmation.images ? (
                              <div className="relative">
                                <img
                                  src={affirmation.images.file_url}
                                  alt={affirmation.images.original_filename}
                                  className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border items-center justify-center hidden">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                {/* Delete Image Button */}
                                <button
                                  onClick={() => removeImageFromAffirmation(affirmation)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  title="Remove image"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                {/* Change Image Button */}
                                <button
                                  onClick={() => handleImageSelect(affirmation)}
                                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  title="Change image"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleImageSelect(affirmation)}
                                className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center group transition-colors"
                                title="Click to add image"
                              >
                                <div className="text-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">Add Image</span>
                                </div>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium mb-2">{affirmation.text}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                style={{ backgroundColor: affirmation.categories?.color || '#3B82F6' }}
                                className="text-white"
                              >
                                {affirmation.categories?.name || 'Unknown'}
                              </Badge>
                              {affirmation.images && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {affirmation.images.original_filename}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(affirmation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(affirmation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Affirmation</DialogTitle>
            <DialogDescription>
              Update the affirmation details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editText">Affirmation Text *</Label>
              <Input
                id="editText"
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter affirmation text..."
                required
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editImage">Image (Optional)</Label>
              <Select
                value={formData.image_id || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, image_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select image" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No image</SelectItem>
                  {images
                    .filter(img => img.category_id === formData.category_id)
                    .map(image => (
                      <SelectItem key={image.id} value={image.id}>
                        <div className="flex items-center gap-2">
                          <img
                            src={image.file_url}
                            alt={image.original_filename}
                            className="w-6 h-6 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <ImageIcon className="h-4 w-4 hidden" />
                          <span className="truncate">{image.original_filename}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Selection Modal */}
      <Dialog open={isImageSelectDialogOpen} onOpenChange={setIsImageSelectDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Image for Affirmation</DialogTitle>
            <DialogDescription>
              Choose an image from the "{selectedAffirmationForImage?.categories?.name}" category or remove the current image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Affirmation Info */}
            {selectedAffirmationForImage && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{selectedAffirmationForImage.text}</p>
                <p className="text-sm text-gray-500">
                  Category: {selectedAffirmationForImage.categories?.name}
                </p>
              </div>
            )}

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {/* No Image Option */}
              <button
                onClick={() => removeImageFromAffirmation(selectedAffirmationForImage)}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 flex flex-col items-center justify-center group transition-colors"
              >
                <X className="h-8 w-8 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 mb-2" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300">Remove Image</span>
              </button>

              {/* Available Images */}
              {images
                .filter(img => img.category_id === selectedAffirmationForImage?.category_id)
                .map(image => (
                  <button
                    key={image.id}
                    onClick={() => assignImageToAffirmation(image.id)}
                    className="p-2 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <img
                      src={image.file_url}
                      alt={image.original_filename}
                      className="w-full h-24 object-cover rounded mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-24 bg-gray-100 rounded mb-2 items-center justify-center hidden">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate group-hover:text-gray-800 dark:group-hover:text-gray-200">
                      {image.original_filename}
                    </p>
                  </button>
                ))}
            </div>

            {/* No Images Available */}
            {images.filter(img => img.category_id === selectedAffirmationForImage?.category_id).length === 0 && (
              <div className="text-center py-8">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Images Available</h3>
                <p className="text-gray-500 mb-4">
                  There are no images uploaded for the "{selectedAffirmationForImage?.categories?.name}" category yet.
                </p>
                <Button onClick={() => router.push('/admin/images')} variant="outline">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsImageSelectDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
          </div>
  );
}
