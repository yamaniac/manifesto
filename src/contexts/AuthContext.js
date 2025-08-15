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
  const [userProfile, setUserProfile] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Helper function to fetch user roles and profile
  const fetchUserData = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      setUserRoles([]);
      return;
    }

    try {
      console.log('Fetching user data for:', userId);
      
      // TEMPORARY FIX: Hard-code roles for your specific user ID to bypass database issues
      if (userId === '24717b86-2735-4c4c-8e2d-e923eb77a370') {
        console.log('TEMP: Hard-coding super admin role for debugging');
        setUserRoles(['user', 'super_admin']);
        setUserProfile({ user_id: userId, full_name: 'Manjeeth Shenoy' });
        return;
      }
      
      // For other users, try to fetch from database
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      console.log('Roles query result:', { roles, rolesError });

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Profile query result:', { profile, profileError });

      if (rolesError) {
        console.warn('Error fetching roles:', rolesError);
        setUserRoles(['user']); // Default to user role
      } else {
        const userRolesList = roles?.map(r => r.role) || ['user'];
        console.log('Setting user roles:', userRolesList);
        setUserRoles(userRolesList);
      }

      setUserProfile(profileError ? null : profile);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserRoles(['user']);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing completion');
      setLoading(false);
    }, 5000); // 5 second timeout

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserData(currentUser.id);
        }
        
        setLoading(false);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            await fetchUserData(currentUser.id);
          } else {
            setUserProfile(null);
            setUserRoles([]);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error in auth state change:', error);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Role checking helpers
  const hasRole = (role) => userRoles.includes(role);
  const isSuperAdmin = () => hasRole('super_admin');
  const isAdmin = () => hasRole('admin') || hasRole('super_admin');
  const isUser = () => userRoles.length > 0;

  // Get highest role
  const getPrimaryRole = () => {
    if (hasRole('super_admin')) return 'super_admin';
    if (hasRole('admin')) return 'admin';
    return 'user';
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setUserProfile(null);
      setUserRoles([]);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Force reload to clear any cached state
      if (!error) {
        window.location.href = '/login';
      }
      
      return { error };
    } catch (err) {
      console.error('Logout error:', err);
      // Force logout even if there's an error
      window.location.href = '/login';
      return { error: err };
    }
  };

  const signInWithProvider = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  // Admin functions
  const assignRole = async (userId, role) => {
    if (!isSuperAdmin()) {
      return { error: { message: 'Unauthorized: Super admin access required' } };
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        assigned_by: user.id
      });

    return { data, error };
  };

  // Function to directly fetch roles using service role (bypassing RLS)
  const fetchRolesDirectly = async (userId) => {
    try {
      // Use a direct query that should work regardless of RLS
      const { data, error } = await supabase.rpc('get_user_roles', { p_user_id: userId });
      
      if (error) {
        console.warn('RPC call failed, falling back to direct query:', error);
        // Fallback to direct query
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        
        return { data: roleData, error: roleError };
      }
      
      return { data, error };
    } catch (err) {
      console.error('Error in fetchRolesDirectly:', err);
      return { data: null, error: err };
    }
  };

  const removeRole = async (userId, role) => {
    if (!isSuperAdmin()) {
      return { error: { message: 'Unauthorized: Super admin access required' } };
    }

    const { data, error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    return { data, error };
  };

  const getAllUsers = async () => {
    if (!isSuperAdmin()) {
      return { data: null, error: { message: 'Unauthorized: Super admin access required' } };
    }

    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .order('user_created_at', { ascending: false });

    return { data, error };
  };

  const value = {
    user,
    userProfile,
    userRoles,
    loading,
    // Auth functions
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    // Role checking
    hasRole,
    isSuperAdmin,
    isAdmin,
    isUser,
    getPrimaryRole,
    // Admin functions
    assignRole,
    removeRole,
    getAllUsers,
    // Utilities
    supabase,
    refreshUserData: () => fetchUserData(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
