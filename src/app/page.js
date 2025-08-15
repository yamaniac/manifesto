'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Crown, Shield, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, signOut, isSuperAdmin, isAdmin, getPrimaryRole } = useAuth();
  const router = useRouter();

  // Redirect to admin page when user is authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/admin');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <main className="flex flex-col items-center space-y-4">
          <h1 className="text-4xl font-bold">Welcome to Manifesto!</h1>
          <p className="text-muted-foreground text-center max-w-md">
            A modern application with Supabase authentication and shadcn/ui components.
          </p>
          <Button onClick={() => router.push('/login')}>
            Get Started
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isSuperAdmin() ? "destructive" : isAdmin() ? "default" : "secondary"}>
                {isSuperAdmin() && <Crown className="mr-1 h-3 w-3" />}
                {isAdmin() && !isSuperAdmin() && <Shield className="mr-1 h-3 w-3" />}
                {!isAdmin() && <User className="mr-1 h-3 w-3" />}
                {getPrimaryRole()}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin() && (
              <Button onClick={() => router.push('/admin')}>
                <Crown className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Welcome Back!
              </CardTitle>
              <CardDescription>
                You're successfully authenticated with Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">Roles:</p>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    super_admin
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">User ID:</p>
                <p className="font-mono text-xs">{user.id}</p>
                <p className="text-sm text-muted-foreground">Debug - Roles Array:</p>
                <p className="font-mono text-xs">["super_admin"]</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>
                Your current session details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Authenticated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Last sign in: {new Date(user.last_sign_in_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Next steps for your app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    Settings
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push('/affirmations')}
                    className="col-span-2"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Affirmations
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    console.log('Manual refresh triggered');
                    refreshUserData();
                  }}
                  className="w-full"
                >
                  🔄 Refresh Roles
                </Button>
                <p className="text-sm text-muted-foreground">
                  Build amazing features with Supabase and shadcn/ui!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <MessageSquare className="h-5 w-5" />
                Daily Affirmations
              </CardTitle>
              <CardDescription>
                Create and manage your positive affirmations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Build a collection of positive thoughts and daily mantras to inspire your journey.
                </p>
                <Button 
                  onClick={() => router.push('/affirmations')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open Affirmations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
