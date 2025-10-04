'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupScreen from './SignupScreen';
import { useAuth } from '@/contexts/AuthContext';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { signIn, isLoading } = useAuth();
  const router = useRouter();
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    setLoginError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setLoginError(error.message || 'Login failed. Please try again.');
        return;
      }
      
      // Login successful - navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    // Optionally show success message or redirect
    alert('Account created successfully! Please check your email to verify your account.');
  };

  if (showSignup) {
    return (
      <SignupScreen 
        onSignupSuccess={handleSignupSuccess}
        onBackToLogin={() => setShowSignup(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">ResQMe Admin Console</h2>
          <p className="mt-2 text-center text-sm text-gray-400">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {loginError && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-md">
              {loginError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                Forgot your password?
              </a>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setShowSignup(true)}
              className="flex-1 group relative flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
