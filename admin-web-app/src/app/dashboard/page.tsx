'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardScreen from '@/components/DashboardScreen';

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not authenticated - redirect to login
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always redirect to home page, regardless of errors
      router.push('/');
      // Force a page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  // Show loading during auth check
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden">
      <DashboardScreen onLogout={handleLogout} />
    </div>
  );
}
