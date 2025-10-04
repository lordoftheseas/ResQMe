import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import LoginScreen from '@/components/login';
import SignupScreen from '@/components/signup';

export default function AuthDemoScreen() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup'>('login');

  const handleNavigateToSignup = () => {
    setCurrentScreen('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('login');
  };

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
