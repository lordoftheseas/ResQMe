import { supabase } from '@/lib/supabase';

export interface UserInformationData {
  id?: string;
  user_id: string;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  disability?: string;
  special_needs?: string;
  weight?: number;
  updated_at?: string;
}

export const userInformationService = {
  // Create new user information
  async createUserInformation(data: Omit<UserInformationData, 'id' | 'updated_at'>) {
    try {
      const { data: result, error } = await supabase
        .from('user_information')
        .insert({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get user information by ID
  async getUserInformationById(id: string) {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get user information by user ID
  async getUserInformationByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); 

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user information
  async updateUserInformation(id: string, data: Omit<UserInformationData, 'id' | 'updated_at'>) {
    try {
      const { data: result, error } = await supabase
        .from('user_information')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};