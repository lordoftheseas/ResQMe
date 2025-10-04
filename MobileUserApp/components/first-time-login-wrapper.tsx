import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import UserInformationForm from '@/components/user-information-form';
import { useAuth } from '@/contexts/AuthContext';
import { userInformationService } from '@/lib/services';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

interface FirstTimeLoginWrapperProps {
  children: React.ReactNode;
}

export default function FirstTimeLoginWrapper({ children }: FirstTimeLoginWrapperProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasUserInfo, setHasUserInfo] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    checkUserInformation();
  }, [user]);

  const checkUserInformation = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await userInformationService.getUserInformationByUserId(user.id);
      
      if (error) {
        console.error('Error checking user information:', error);
        setHasUserInfo(false);
        setShowForm(true);
      } else if (data) {
        setHasUserInfo(true);
        setShowForm(false);
        router.replace('/(tabs)');
      } else {
        setHasUserInfo(false);
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error checking user information:', error);
      setHasUserInfo(false);
      setShowForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormComplete = () => {
    setHasUserInfo(true);
    setShowForm(false);
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (showForm && !hasUserInfo) {
    return <UserInformationForm onComplete={handleFormComplete} />;
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});