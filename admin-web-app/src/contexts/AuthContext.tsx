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

  const isAuthenticated = !!user;

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { user } = await auth.getCurrentUser();
        if (!mounted) return;

        setUser(user);
        if (user) {
          const { isAdmin: adminStatus } = await auth.isUserAdmin(user.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSession();

    const { data } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (!mounted) return;

      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { isAdmin: adminStatus } = await auth.isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    setIsLoading(true);
    try {
      const { error } = await auth.signUp(email, password, userData);
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
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsLoading(false);

    try {
      const { error } = await auth.signOut();
      return { error };
    } catch (error) {
      return { error };
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
    <AuthContext.Provider
      value={{
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
        updateUserProfile,
      }}
    >
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
