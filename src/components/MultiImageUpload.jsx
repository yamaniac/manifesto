'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Upload, X, Image as ImageIcon, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

export default function MultiImageUpload() {
  const { user, isSuperAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const fileInputRef = useRef(null);

  // Show message with auto-hide
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
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
    } finally {
      setIsLoadingCategories(false);
    }
  }, [showMessage]);

  // Load categories on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchCategories();
    }
  }, [isSuperAdmin, fetchCategories]);

  // Validate file
  const validateFile = (file) => {
    const errors = [];
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    return errors;
  };

  // Handle file selection
  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    // Check total file count
    if (selectedFiles.length + fileArray.length > MAX_FILES) {
      showMessage('error', `Maximum ${MAX_FILES} files allowed. You can select ${MAX_FILES - selectedFiles.length} more files.`);
      return;
    }

    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          filename: file.name,
          categoryId: null,
          status: 'pending',
          progress: 0,
          error: null
        });
      } else {
        errors.push(`${file.name}: ${fileErrors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      showMessage('error', errors.join('; '));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  }, [selectedFiles.length, showMessage]);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  // Remove file from selection
  const removeFile = useCallback((fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Update category for a file
  const updateFileCategory = useCallback((fileId, categoryId) => {
    setSelectedFiles(prev => 
      prev.map(f => 
        f.id === fileId ? { ...f, categoryId } : f
      )
    );
  }, []);

  // Apply category to all files
  const applyCategoryToAll = useCallback((categoryId) => {
    setSelectedFiles(prev => 
      prev.map(f => ({ ...f, categoryId }))
    );
  }, []);

  // Upload files
  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      showMessage('error', 'Please select files to upload');
      return;
    }

    // Check if all files have categories assigned
    const filesWithoutCategory = selectedFiles.filter(f => !f.categoryId);
    if (filesWithoutCategory.length > 0) {
      showMessage('error', 'Please assign categories to all files before uploading');
      return;
    }

    setIsUploading(true);
    setUploadProgress({});
    setUploadStatus({});

    try {
      const formData = new FormData();
      selectedFiles.forEach((fileObj, index) => {
        formData.append(`files`, fileObj.file);
        formData.append(`categories`, fileObj.categoryId);
      });

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update status for each file
      const newStatus = {};
      const newProgress = {};
      
      selectedFiles.forEach((fileObj, index) => {
        if (result.data && result.data[index]) {
          newStatus[fileObj.id] = 'success';
          newProgress[fileObj.id] = 100;
        } else {
          newStatus[fileObj.id] = 'error';
          newProgress[fileObj.id] = 0;
        }
      });

      setUploadStatus(newStatus);
      setUploadProgress(newProgress);

      const successCount = Object.values(newStatus).filter(status => status === 'success').length;
      const errorCount = Object.values(newStatus).filter(status => status === 'error').length;

      if (successCount > 0) {
        showMessage('success', `Successfully uploaded ${successCount} file(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        
        // Clear successful uploads after a delay
        setTimeout(() => {
          setSelectedFiles(prev => prev.filter(f => newStatus[f.id] !== 'success'));
          setUploadStatus({});
          setUploadProgress({});
        }, 3000);
      } else {
        showMessage('error', 'All uploads failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed: ';
      if (error.name === 'AbortError') {
        errorMessage += 'Upload timed out. Please try with fewer files or smaller file sizes.';
      } else if (error.message.includes('504')) {
        errorMessage += 'Server timeout. Please try uploading fewer files at once.';
      } else if (error.message.includes('Server error:')) {
        errorMessage += error.message;
      } else {
        errorMessage += error.message;
      }
      
      showMessage('error', errorMessage);
      
      // Mark all files as failed
      const newStatus = {};
      selectedFiles.forEach(fileObj => {
        newStatus[fileObj.id] = 'error';
      });
      setUploadStatus(newStatus);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, showMessage]);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
    setUploadStatus({});
    setUploadProgress({});
  }, []);

  if (!user || !isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Required</h3>
            <p className="text-muted-foreground">
              You need super admin privileges to upload images.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Multi-Image Upload
          </CardTitle>
          <CardDescription>
            Upload up to {MAX_FILES} images at once. Drag & drop or click to select files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Message Display */}
          {message.text && (
            <div className={`p-3 mb-4 rounded-md flex items-center gap-2 ${
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

          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop images here or click to select</h3>
            <p className="text-gray-500 mb-4">
              Supports JPG, PNG, WEBP, SVG up to 5MB each
            </p>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          </div>

          {/* File Count */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {selectedFiles.length} of {MAX_FILES} files selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || selectedFiles.length === 0}
                >
                  {isUploading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Selected Files</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={applyCategoryToAll}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Apply category to all" />
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedFiles.map((fileObj) => (
                <div key={fileObj.id} className="border rounded-lg p-4 space-y-3">
                  {/* Image Preview */}
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(fileObj.file)}
                      alt={fileObj.filename}
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeFile(fileObj.id)}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* File Info */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium truncate" title={fileObj.filename}>
                      {fileObj.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>

                    {/* Category Selector */}
                    <Select
                      value={fileObj.categoryId || ''}
                      onValueChange={(value) => updateFileCategory(fileObj.id, value)}
                      disabled={isUploading}
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

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-1">
                        <Progress value={uploadProgress[fileObj.id] || 0} className="h-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span>
                            {uploadStatus[fileObj.id] === 'success' && (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Success
                              </span>
                            )}
                            {uploadStatus[fileObj.id] === 'error' && (
                              <span className="text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Failed
                              </span>
                            )}
                            {!uploadStatus[fileObj.id] && 'Uploading...'}
                          </span>
                          <span>{Math.round(uploadProgress[fileObj.id] || 0)}%</span>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    {uploadStatus[fileObj.id] && !isUploading && (
                      <Badge 
                        variant={uploadStatus[fileObj.id] === 'success' ? 'default' : 'destructive'}
                        className="w-full justify-center"
                      >
                        {uploadStatus[fileObj.id] === 'success' ? 'Uploaded' : 'Failed'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
