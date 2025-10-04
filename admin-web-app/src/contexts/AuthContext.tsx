'use client';

import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  isUserAdmin: (userId: string) => Promise<{ isAdmin: boolean; error: any }>;
  getUserProfile: (userId: string) => Promise<{ data: any; error: any }>;
  updateUserProfile: (userId: string, updates: any) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Derived state
  const isAuthenticated = !!user;

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { user } = await auth.getCurrentUser();
        setUser(user);
        
        if (user) {
          // Check if user is admin
          console.log('Checking admin status for user:', user.email);
          const { isAdmin: userIsAdmin, error } = await auth.isUserAdmin(user.id);
          console.log('Admin check result:', { isAdmin: userIsAdmin, error });
          setIsAdmin(userIsAdmin);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user is admin
        console.log('Checking admin status for user:', session.user.email);
        const { isAdmin: userIsAdmin, error } = await auth.isUserAdmin(session.user.id);
        console.log('Admin check result:', { isAdmin: userIsAdmin, error });
        setIsAdmin(userIsAdmin);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    setIsLoading(true);
    try {
      const { error } = await auth.signUp(email, password, userData);
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await auth.signIn(email, password);
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const isUserAdmin = async (userId: string) => {
    try {
      const { isAdmin, error } = await auth.isUserAdmin(userId);
      return { isAdmin, error };
    } catch (error) {
      return { isAdmin: false, error };
    }
  };

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await auth.getUserProfile(userId);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updateUserProfile = async (userId: string, updates: any) => {
    try {
      const { data, error } = await auth.updateUserProfile(userId, updates);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAdmin, 
      isAuthenticated,
      signUp, 
      signIn, 
      signOut, 
      isUserAdmin,
      getUserProfile,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
