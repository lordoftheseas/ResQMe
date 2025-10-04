import { createClient } from '@supabase/supabase-js';
import dbManager from '../database/dbManager';


const supabaseUrl = 'https://rpwjnihpvrhhknnzvhav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2puaWhwdnJoaGtubnp2aGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDk1NzAsImV4cCI6MjA3NTEyNTU3MH0.SE-NNz7nj49qkCsBfUMfUchV6gbvcf03Pm80H6_P3zw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log(supabase);

export const auth = {
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
        // Check if this is an admin email
        const isAdmin = this.isAdminEmail(email);
        
        // Create user in Supabase (for remote sync)
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            is_admin: isAdmin
          });

        if (profileError) {
          console.error('Error creating user profile in Supabase:', profileError);
        }

        // Also create user in local database
        try {
          await dbManager.createUser({
            id: data.user.id,
            email: data.user.email || email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            is_admin: isAdmin
          });
          console.log('User created in local database');
          if (isAdmin) {
            console.log('Admin account created successfully');
          }
        } catch (localError) {
          console.error('Error creating user in local database:', localError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },


  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },


  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },


  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },


  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

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



  // Check if email belongs to admin
  isAdminEmail(email: string): boolean {
    const adminEmails = [
      'admin@rescue.org',
      'admin@resqme.com',
      'administrator@rescue.org',
      'administrator@resqme.com',
      // Add more admin emails as needed
      'admin@test.com',
      'test@admin.com'
    ];
    return adminEmails.includes(email.toLowerCase());
  },

  // Check if user is admin
  async isUserAdmin(userId: string) {
    try {
      // First check local database
      const localUser = await dbManager.getUserById(userId);
      if (localUser) {
        return { isAdmin: localUser.is_admin, error: null };
      }

      // Fallback to Supabase
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

};
