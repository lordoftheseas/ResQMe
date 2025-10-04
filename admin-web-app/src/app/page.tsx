'use client';

import { useState, useEffect } from 'react';
import LoginScreen from '../components/LoginScreen';
import ScanningScreen from '../components/ScanningScreen';
import DashboardScreen from '../components/DashboardScreen';

type Screen = 'login' | 'scanning' | 'dashboard';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isInitialized, setIsInitialized] = useState(false);

  // Persist state across hot reloads
  useEffect(() => {
    const savedScreen = localStorage.getItem('resqme-current-screen') as Screen;
    if (savedScreen && savedScreen !== 'login') {
      setCurrentScreen(savedScreen);
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('resqme-current-screen', currentScreen);
    }
  }, [currentScreen, isInitialized]);

  const handleLoginSuccess = () => {
    setCurrentScreen('scanning');
    // Auto-proceed to dashboard after 5 seconds
    setTimeout(() => {
      setCurrentScreen('dashboard');
    }, 5000);
  };

  const handleScanComplete = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('resqme-current-screen');
    setCurrentScreen('login');
  };

  // Show loading during initialization
  if (!isInitialized) {
    return (
      <div className="h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-200 font-sans overflow-hidden">
      {currentScreen === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentScreen === 'scanning' && (
        <ScanningScreen onScanComplete={handleScanComplete} />
      )}
      
      {currentScreen === 'dashboard' && (
        <DashboardScreen onLogout={handleLogout} />
      )}
    </div>
  );
}
