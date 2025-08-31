'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [primaryRole, setPrimaryRole] = useState(null);
  const supabase = createClient();

  // Simplified role fetching without async operations in useEffect
  const updateUserRoles = useCallback((currentUser) => {
    if (!currentUser) {
      setUserRoles([]);
      setPrimaryRole(null);
      return;
    }

    // For now, set default roles for temp admin access
    setUserRoles(['super_admin']);
    setPrimaryRole('super_admin');
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = () => {
      // Get initial session synchronously
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log('🔍 Setting temp admin access for user:', currentUser.email);
          
          // TEMPORARY: Give admin access to any authenticated user for setup
          setIsAdmin(true);
          setIsSuperAdminUser(true);
          
          // Update user roles
          updateUserRoles(currentUser);
        } else {
          setIsAdmin(false);
          setIsSuperAdminUser(false);
          setUserRoles([]);
          setPrimaryRole(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }).catch((error) => {
        console.error('Error getting session:', error);
        if (isMounted) {
          setLoading(false);
        }
      });
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log('🔍 Setting temp admin access for user:', currentUser.email);
          
          // TEMPORARY: Give admin access to any authenticated user for setup
          setIsAdmin(true);
          setIsSuperAdminUser(true);
          
          // Update user roles
          updateUserRoles(currentUser);
        } else {
          setIsAdmin(false);
          setIsSuperAdminUser(false);
          setUserRoles([]);
          setPrimaryRole(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, updateUserRoles]);

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

  // Synchronous role functions
  const getPrimaryRole = () => {
    if (user && isSuperAdminUser) {
      return primaryRole || 'super_admin';
    }
    return primaryRole;
  };

  const getUserRoles = () => {
    return userRoles;
  };

  // Simple user management functions
  const getAllUsers = async () => {
    try {
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
    // Synchronous state variables
    isAdmin,
    isSuperAdmin: isSuperAdminUser,
    // Synchronous role functions
    getPrimaryRole,
    getUserRoles,
    // User management functions
    getAllUsers,
    assignRole,
    removeRole,
    supabase,
  };

  console.log('🔍 AuthContext value:', { 
    user: user ? { id: user.id, email: user.email } : null, 
    isAdmin, 
    isSuperAdmin: isSuperAdminUser,
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
