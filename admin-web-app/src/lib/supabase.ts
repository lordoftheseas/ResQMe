import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpwjnihpvrhhknnzvhav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2puaWhwdnJoaGtubnp2aGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDk1NzAsImV4cCI6MjA3NTEyNTU3MH0.SE-NNz7nj49qkCsBfUMfUchV6gbvcf03Pm80H6_P3zw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { firstName?: string; lastName?: string; phone?: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;

      if (data.user && userData) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            is_admin: false
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: { first_name?: string; last_name?: string; phone?: string; is_admin?: boolean }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
        })
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Check if user is admin
  async isUserAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { isAdmin: data?.is_admin || false, error: null };
    } catch (error) {
      return { isAdmin: false, error };
    }
  },

  // Check if email is admin email (for admin console access)
  isAdminEmail(email: string) {
    const adminEmails = [
      'admin@resqme.com',
      'administrator@resqme.com',
      'support@resqme.com'
    ];
    return adminEmails.includes(email.toLowerCase());
  }
};
