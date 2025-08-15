'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const supabase = createClient();
        
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Force redirect to login
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even on error
        window.location.href = '/login';
      }
    };

    handleLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Signing you out...</p>
      </div>
    </div>
  );
}

