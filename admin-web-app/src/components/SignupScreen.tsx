'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
}

export default function SignupScreen({ onSignupSuccess, onBackToLogin }: SignupScreenProps) {
  const { signUp, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: 'Manav',
    lastName: 'Sharma',
    email: 'admin@gmail.com',
    phone: '123424533',
    password: '12345678',
    confirmPassword: '12345678',
    terms: false
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, phone, password, confirmPassword, terms } = formData;

    if (!firstName || !lastName || !email || !password) {
      setSignupError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters long');
      return;
    }

    if (!terms) {
      setSignupError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setSignupError(null);

    try {
      const userData = {
        firstName,
        lastName,
        phone: phone || undefined
      };

      const { error } = await signUp(email, password, userData);
      
      if (error) {
        setSignupError(error.message || 'Signup failed. Please try again.');
        return;
      }
      
      router.push('/dashboard');
    } catch (error) {
      setSignupError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Create Account</h2>
          <p className="mt-2 text-center text-sm text-gray-400">Sign up for ResQMe Admin Console</p>
        </div>
        
        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          {signupError && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-md">
              {signupError}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-first-name" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  id="signup-first-name"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="signup-last-name" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  id="signup-last-name"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="john.doe@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Password must be at least 6 characters long</p>
            </div>
            
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-700 bg-gray-900 text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="signup-terms"
                name="terms"
                type="checkbox"
                required
                checked={formData.terms}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="signup-terms" className="ml-2 block text-sm text-gray-300">
                I agree to the <a href="#" className="text-indigo-400 hover:text-indigo-300">Terms of Service</a> and <a href="#" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 group relative flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
