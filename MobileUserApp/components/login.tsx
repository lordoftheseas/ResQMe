import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

interface LoginScreenProps {
  onNavigateToSignup?: () => void;
}

export default function LoginScreen({ onNavigateToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('manav.sharma@gmail.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { signIn } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('Invalid login credentials')) {
          Alert.alert('Error', 'Invalid email or password. Please try again.');
        } else {
          Alert.alert('Error', (error as Error).message || 'Login failed');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    if (onNavigateToSignup) {
      onNavigateToSignup();
    } else {
      Alert.alert('Sign Up', 'Sign up functionality would be implemented here');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
        <ThemedView style={styles.content}>
          {/* Logo/Header */}
          <ThemedView style={styles.header}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
            <ThemedText style={styles.title}>
              ResQme
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Your Emergency Response Companion
            </ThemedText>
          </ThemedView>

          {/* Login Form */}
          <ThemedView style={styles.form}>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>
                Email Address
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
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

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>
                Password
              </ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.input}
              />
            </ThemedView>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            >
              <ThemedText style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </ThemedText>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>

            {/* Divider */}
            <ThemedView style={styles.divider}>
              <ThemedView style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>
                OR
              </ThemedText>
              <ThemedView style={styles.dividerLine} />
            </ThemedView>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              style={styles.signUpButton}
            >
              <ThemedText style={styles.signUpButtonText}>
                Create Account
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Footer */}
          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </ThemedText>
          </ThemedView>
        </ThemedView>
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
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 1,
    marginTop: -15,
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
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  signUpButtonText: {
    color: '#2563EB',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  footer: {
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
