import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import FirstTimeLoginWrapper from '@/components/first-time-login-wrapper';
import LoginScreen from '@/components/login';
import SignupScreen from '@/components/signup';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (user) {
      // Let FirstTimeLoginWrapper handle the flow
      // It will either show the form or navigate to tabs
    }
  }, [user]);

  const handleNavigateToSignup = () => {
    setCurrentScreen('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('login');
  };

  if (user) {
    return <FirstTimeLoginWrapper><View /></FirstTimeLoginWrapper>;
  }

  return (
    <View style={styles.container}>
      {currentScreen === 'login' ? (
        <LoginScreen onNavigateToSignup={handleNavigateToSignup} />
      ) : (
        <SignupScreen onNavigateToLogin={handleNavigateToLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 