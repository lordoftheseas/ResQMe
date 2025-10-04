import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

interface SignupScreenProps {
  onNavigateToLogin?: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    firstName: 'Manav',
    lastName: 'Sharma',
    email: 'manav.sharma@gmail.com',
    password: '123456',
    confirmPassword: '123456',
    phone: '1234567890',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { signUp } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'email') {
      validateEmail(value);
    }
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword, phone } = formData;

    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      const { error } = await signUp(formData.email, formData.password, userData);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to create account');
      } else {
            Alert.alert(
              'Success!',
              'Account created successfully! You can now log in.',
              [{ text: 'OK', onPress: () => console.log('Signup successful') }]
            );
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      Alert.alert('Back to Login', 'This would navigate back to the login screen');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.content}>
          {/* Logo/Header */}
          <ThemedView style={styles.header}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
            <ThemedText style={styles.title}>
              Join ResQme
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Create your emergency response account
            </ThemedText>
          </ThemedView>

          {/* Signup Form */}
          <ThemedView style={styles.form}>
            {/* Name Fields */}
            <ThemedView style={styles.nameRow}>
              <ThemedView style={styles.nameField}>
                <ThemedText style={styles.label}>
                  First Name
                </ThemedText>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  style={styles.input}
                />
              </ThemedView>
              
              <ThemedView style={styles.nameField}>
                <ThemedText style={styles.label}>
                  Last Name
                </ThemedText>
                <TextInput
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  style={styles.input}
                />
              </ThemedView>
            </ThemedView>

            {/* Email */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>
                Email Address
              </ThemedText>
              <TextInput
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="john.doe@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, emailError && styles.inputError]}
              />
              {emailError ? (
                <ThemedText style={styles.errorText}>{emailError}</ThemedText>
              ) : null}
            </ThemedView>

            {/* Phone */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>
                Phone Number
              </ThemedText>
              <TextInput
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </ThemedView>

            {/* Password */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>
                Password
              </ThemedText>
              <TextInput
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.input}
              />
            </ThemedView>

            {/* Confirm Password */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>
                Confirm Password
              </ThemedText>
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.input}
              />
            </ThemedView>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            >
              <ThemedText style={styles.signupButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </ThemedText>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity style={styles.backToLogin} onPress={handleBackToLogin}>
              <ThemedText style={styles.backToLoginText}>
                Already have an account? Sign In
              </ThemedText>
            </TouchableOpacity>

            {/* Terms */}
            <ThemedView style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
                {' '}and{' '}
                <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
    gap: 8,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  signupButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signupButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  backToLogin: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '500',
  },
});
