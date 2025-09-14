'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Upload, Music, Play, Pause, Trash2, Download, FileAudio, ArrowLeft, Edit2, Save, X, RefreshCw } from 'lucide-react';

export default function AudioManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileTitles, setFileTitles] = useState({});
  const [fileDescriptions, setFileDescriptions] = useState({});
  const [playingAudio, setPlayingAudio] = useState(null);
  const [error, setError] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load audio files on component mount
  useEffect(() => {
    if (user) {
      loadAudioFiles();
    }
  }, [user]);

  const loadAudioFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audio');
      const data = await response.json();
      
      if (response.ok) {
        setAudioFiles(data.data || []);
      } else {
        setError(data.error || 'Failed to load audio files');
      }
    } catch (err) {
      setError('Failed to load audio files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    // Initialize titles and descriptions
    const titles = {};
    const descriptions = {};
    files.forEach((file, index) => {
      titles[index] = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      descriptions[index] = '';
    });
    setFileTitles(titles);
    setFileDescriptions(descriptions);
  };

  const handleTitleChange = (index, value) => {
    setFileTitles(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleDescriptionChange = (index, value) => {
    setFileDescriptions(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      
      // Add files
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Add titles and descriptions
      selectedFiles.forEach((_, index) => {
        formData.append('titles', fileTitles[index] || '');
        formData.append('descriptions', fileDescriptions[index] || '');
      });

      // Simulate progress for large files
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until actually complete
          return prev + Math.random() * 10;
        });
      }, 1000);

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok) {
        // Reload audio files
        await loadAudioFiles();
        // Clear form
        setSelectedFiles([]);
        setFileTitles({});
        setFileDescriptions({});
        setError('');
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (audioId) => {
    if (!confirm('Are you sure you want to delete this audio file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/audio/${audioId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAudioFiles();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete audio file');
      }
    } catch (err) {
      setError('Failed to delete audio file');
    }
  };

  const handleEdit = (audioFile) => {
    setEditingFile(audioFile.id);
    setEditTitle(audioFile.title);
    setEditDescription(audioFile.description || '');
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveEdit = async (audioId) => {
    if (!editTitle.trim()) {
      setError('Title is required');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/audio/${audioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });

      if (response.ok) {
        await loadAudioFiles();
        setEditingFile(null);
        setEditTitle('');
        setEditDescription('');
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update audio file');
      }
    } catch (err) {
      setError('Failed to update audio file: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePlayPause = (audioId, audioUrl) => {
    if (playingAudio === audioId) {
      setPlayingAudio(null);
      // Stop audio
      const audio = document.querySelector(`audio[data-audio-id="${audioId}"]`);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } else {
      setPlayingAudio(audioId);
      // Play audio
      const audio = document.querySelector(`audio[data-audio-id="${audioId}"]`);
      if (audio) {
        audio.play();
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading audio files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Music className="h-8 w-8" />
            Audio Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage audio files for affirmations
          </p>
        </div>
        <Button 
          onClick={() => router.push('/admin/dashboard')} 
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Audio Files
          </CardTitle>
          <CardDescription>
            Select audio files to upload. Supported formats: MP3, WAV, OGG, M4A, AAC, WebM
            <br />
            <span className="text-amber-600 font-medium">Large files (up to 100MB) are supported with extended timeout.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="audio-files">Select Audio Files</Label>
            <Input
              id="audio-files"
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="mt-1"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">File Details</h3>
              {selectedFiles.map((file, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileAudio className="h-4 w-4" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                    {file.size > 50 * 1024 * 1024 && (
                      <Badge variant="destructive" className="text-xs">
                        Large File
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${index}`}>Title</Label>
                      <Input
                        id={`title-${index}`}
                        value={fileTitles[index] || ''}
                        onChange={(e) => handleTitleChange(index, e.target.value)}
                        placeholder="Enter title for this audio file"
                        disabled={uploading}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Input
                        id={`description-${index}`}
                        value={fileDescriptions[index] || ''}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        placeholder="Enter description (optional)"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Files ({audioFiles.length})</CardTitle>
          <CardDescription>
            Manage your uploaded audio files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audioFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audio files uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audioFiles.map((audio) => (
                  <TableRow key={audio.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4" />
                        {editingFile === audio.id ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8"
                            placeholder="Enter title"
                          />
                        ) : (
                          audio.title
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {editingFile === audio.id ? (
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="h-8"
                          placeholder="Enter description"
                        />
                      ) : (
                        <span className="truncate block">
                          {audio.description || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatFileSize(audio.file_size)}
                    </TableCell>
                    <TableCell>
                      {formatDate(audio.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingFile === audio.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveEdit(audio.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isUpdating}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePlayPause(audio.id, audio.file_url)}
                            >
                              {playingAudio === audio.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(audio.file_url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(audio)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(audio.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Hidden audio element for playback */}
                      <audio
                        data-audio-id={audio.id}
                        src={audio.file_url}
                        onEnded={() => setPlayingAudio(null)}
                        onError={() => setPlayingAudio(null)}
                        preload="none"
                        style={{ display: 'none' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
