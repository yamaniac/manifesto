'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const { signIn, supabase } = useAuth();
  const router = useRouter();

  // Debug: Check Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Supabase connection test:', { data, error });
        setDebugInfo(`Connection: ${error ? 'Failed' : 'Success'}`);
      } catch (err) {
        console.error('Connection test error:', err);
        setDebugInfo(`Connection Error: ${err.message}`);
      }
    };
    
    checkConnection();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      console.log('Attempting sign in with:', { email, password: '***' });
      
      const result = await signIn(email, password);
      console.log('Sign in result:', result);
      
      const { error } = result;

      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
      } else {
        // Success - wait a moment for auth state to update, then redirect
        console.log('✅ Sign in successful, redirecting to dashboard...');
        console.log('Current URL:', window.location.href);
        setTimeout(() => {
          console.log('Attempting router.push to /admin/dashboard');
          console.log('Current pathname:', window.location.pathname);
          router.push('/admin/dashboard');
          // Backup: use window.location if router.push fails
          setTimeout(() => {
            console.log('After router.push, pathname:', window.location.pathname);
            if (window.location.pathname !== '/admin/dashboard') {
              console.log('Router.push failed, using window.location.replace');
              window.location.replace('/admin/dashboard');
            }
          }, 500);
        }, 100);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Admin Access
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo && (
            <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
              Debug: {debugInfo}
            </div>
          )}
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter>
          <div className="text-center text-sm text-muted-foreground w-full">
            <p>Restricted access - Admin credentials required</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
