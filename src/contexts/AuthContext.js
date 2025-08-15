'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
      } catch (error) {
        console.error('Error getting session:', error);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'An unexpected error occurred during sign in.' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  // Simple role checking - everyone is admin for now
  const isSuperAdmin = () => true;
  const isAdmin = () => true;
  const isUser = () => true;
  const hasRole = () => true;
  const getPrimaryRole = () => 'super_admin';

  // Simple user management functions
  const getAllUsers = async () => {
    try {
      // Just return a simple user list for now
      return { 
        data: [
          {
            id: user?.id || 'current-user',
            email: user?.email || 'Current User',
            full_name: 'Current User',
            roles: ['super_admin'],
            primary_role: 'super_admin'
          }
        ], 
        error: null 
      };
    } catch (error) {
      return { error: { message: 'Error fetching users' } };
    }
  };

  const assignRole = async (userId, role) => {
    return { error: { message: 'Role management disabled in simple mode' } };
  };

  const removeRole = async (userId, role) => {
    return { error: { message: 'Role management disabled in simple mode' } };
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isSuperAdmin,
    isAdmin,
    isUser,
    hasRole,
    getPrimaryRole,
    getAllUsers,
    assignRole,
    removeRole,
    supabase,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
