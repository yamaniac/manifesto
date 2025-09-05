'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Search, Filter, Eye, Trash2, AlertCircle, CheckCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useRouter } from "next/navigation";
import MultiImageUpload from "@/components/MultiImageUpload";

export default function ImagesPage() {
  const { user, isSuperAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  // Show message with auto-hide
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  // Fetch images
  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (selectedCategory) {
        params.append('category_id', selectedCategory);
      }

      const response = await fetch(`/api/images?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch images');
      }
      
      setImages(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching images:', error);
      showMessage('error', 'Error fetching images: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, showMessage]);

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

  // Load data on component mount
  useEffect(() => {
    if (isSuperAdmin && !loading) {
      fetchImages();
      fetchCategories();
    }
  }, [isSuperAdmin, loading, fetchImages, fetchCategories]);

  // Handle search
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchImages();
  }, [fetchImages]);

  // Handle category filter
  const handleCategoryFilter = useCallback((categoryId) => {
    setSelectedCategory(categoryId === 'all' ? '' : categoryId);
    setCurrentPage(1);
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  }, [selectedImages.length, images]);

  // Handle delete selected
  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) {
      showMessage('error', 'Please select images to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedImages.length} image(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds: selectedImages }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete images');
      }

      showMessage('success', `Successfully deleted ${result.deletedCount} image(s)`);
      setSelectedImages([]);
      fetchImages();
    } catch (error) {
      console.error('Error deleting images:', error);
      showMessage('error', 'Error deleting images: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle upload dialog close
  const handleUploadDialogClose = () => {
    setIsUploadDialogOpen(false);
    // Refresh images list
    fetchImages();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-4">
                  You need super admin privileges to manage images.
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
              <ImageIcon className="h-8 w-8 text-blue-500" />
              Image Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload, organize, and manage your images with categories
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={() => signOut()} variant="destructive">
              Logout
            </Button>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`p-3 mb-6 rounded-md flex items-center gap-2 ${
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

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Images
                </CardTitle>
                <CardDescription>
                  Upload multiple images and assign them to categories
                </CardDescription>
              </div>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Multi-Image Upload</DialogTitle>
                    <DialogDescription>
                      Upload up to 20 images at once and assign them to categories
                    </DialogDescription>
                  </DialogHeader>
                  <MultiImageUpload onUploadComplete={handleUploadDialogClose} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={selectedCategory || 'all'} onValueChange={handleCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Images Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Images
                </CardTitle>
                <CardDescription>
                  {images.length} image(s) found
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={fetchImages} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
                {selectedImages.length > 0 && (
                  <Button
                    onClick={handleDeleteSelected}
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedImages.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Images Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory 
                    ? 'No images match your current filters.'
                    : 'Get started by uploading your first images.'
                  }
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedImages.length === images.length && images.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {images.map((image) => (
                      <TableRow key={image.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(image.id)}
                            onChange={() => handleImageSelect(image.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={image.file_url}
                            alt={image.original_filename}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <p className="truncate max-w-48" title={image.original_filename}>
                              {image.original_filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {image.filename}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {image.categories ? (
                            <Badge 
                              variant="outline"
                              className="flex items-center gap-1 w-fit"
                              style={{ 
                                backgroundColor: image.categories.color + '20',
                                borderColor: image.categories.color,
                                color: image.categories.color
                              }}
                            >
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: image.categories.color }}
                              />
                              {image.categories.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic">No category</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(image.file_size / (1024 * 1024)).toFixed(2)} MB
                        </TableCell>
                        <TableCell>
                          {new Date(image.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(image.file_url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImageSelect(image.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
