'use client';

import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UserManagement from '@/components/admin/UserManagement';
import { useRouter } from "next/navigation";
import { Shield, Crown, Users, ArrowLeft, Database, Lock, Tag, MessageSquare, Image, HardDrive, RefreshCw, Music } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isSuperAdmin, getPrimaryRole, loading, signOut } = useAuth();
  const router = useRouter();
  const [isStorageInitializing, setIsStorageInitializing] = useState(false);
  const [isAudioStorageInitializing, setIsAudioStorageInitializing] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  console.log('🔍 AdminDashboard received:', { 
    user: user ? { id: user.id, email: user.email } : null, 
    isSuperAdmin, 
    loading 
  });

  if (loading) {
    console.log('🔄 Dashboard loading...');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const initializeStorage = async () => {
    setIsStorageInitializing(true);
    try {
      const response = await fetch('/api/storage/init', {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Storage bucket initialized successfully!');
      } else {
        const errorData = await response.json();
        alert('Error initializing storage: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      alert('Error initializing storage: ' + error.message);
    } finally {
      setIsStorageInitializing(false);
    }
  };

  const initializeAudioStorage = async () => {
    setIsAudioStorageInitializing(true);
    try {
      const response = await fetch('/api/storage/init-audio', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Audio storage bucket initialized successfully!');
        console.log('Audio storage result:', result);
      } else {
        const errorData = await response.json();
        console.error('Audio storage error:', errorData);
        alert('Error initializing audio storage: ' + (errorData.error || 'Unknown error') + '\n\nDetails: ' + (errorData.details || 'No details available'));
      }
    } catch (error) {
      console.error('Error initializing audio storage:', error);
      alert('Error initializing audio storage: ' + error.message);
    } finally {
      setIsAudioStorageInitializing(false);
    }
  };

  const testAudioStorage = async () => {
    setIsTestingAudio(true);
    try {
      const response = await fetch('/api/audio/test', {
        method: 'GET',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Audio storage test passed! ✅\n\n' + JSON.stringify(result, null, 2));
      } else {
        alert('Audio storage test failed! ❌\n\n' + JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('Error testing audio storage:', error);
      alert('Error testing audio storage: ' + error.message);
    } finally {
      setIsTestingAudio(false);
    }
  };

  if (!user || !isSuperAdmin) {
    console.log('🚫 Access denied - Debug:', { 
      userExists: !!user, 
      userEmail: user?.email,
      isSuperAdmin, 
      loading,
      userType: typeof user,
      userValue: user
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-4">
                  You need super admin privileges to access the admin dashboard.
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

  console.log('✅ Dashboard rendering - user and admin access confirmed');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and system settings
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <Button onClick={() => signOut()} variant="destructive">
              <Lock className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Admin Status Card */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Admin Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Role</p>
                  <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                    <Crown className="h-3 w-3" />
                    {getPrimaryRole() || 'super_admin'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">All Roles</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    <Badge variant="outline" className="text-xs">
                      super_admin
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Super Admins</span>
                  <span className="font-medium">1+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="font-medium">View in table →</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System Status</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/categories')}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Categories
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/affirmations')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Affirmations
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/images')}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Image Management
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/audio')}
                >
                  <Music className="mr-2 h-4 w-4" />
                  Audio Management
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Image Storage</span>
                  <Badge variant="outline" className="text-xs">Affirmation Images</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={initializeStorage}
                  disabled={isStorageInitializing}
                >
                  {isStorageInitializing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="mr-2 h-4 w-4" />
                  )}
                  {isStorageInitializing ? 'Initializing...' : 'Initialize Storage'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Creates storage bucket for affirmation images
                </p>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Audio Storage</span>
                  <Badge variant="outline" className="text-xs">Audio Files</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={initializeAudioStorage}
                  disabled={isAudioStorageInitializing}
                >
                  {isAudioStorageInitializing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Music className="mr-2 h-4 w-4" />
                  )}
                  {isAudioStorageInitializing ? 'Initializing...' : 'Initialize Audio Storage'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={testAudioStorage}
                  disabled={isTestingAudio}
                >
                  {isTestingAudio ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  {isTestingAudio ? 'Testing...' : 'Test Audio Storage'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Creates storage bucket for audio files
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <UserManagement />

        {/* Admin Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Admin Instructions</CardTitle>
            <CardDescription>
              How to manage your super admin system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Assigning Roles</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click "Add Role" next to any user</li>
                  <li>• Choose Admin or Super Admin</li>
                  <li>• Multiple roles can be assigned</li>
                  <li>• Basic "user" role cannot be removed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Role Hierarchy</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Super Admin:</strong> Full system access</li>
                  <li>• <strong>Admin:</strong> Limited management access</li>
                  <li>• <strong>User:</strong> Basic application access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
