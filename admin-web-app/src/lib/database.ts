import { supabase } from './supabase';
import { User, UserInformation, EspSignals } from '../types/index';

export interface UserWithInformation extends User {
  user_information: UserInformation | null;
}

export interface UserWithSignals extends User {
  esp_signals: EspSignals[];
}

export interface UserComplete extends User {
  user_information: UserInformation | null;
  esp_signals: EspSignals[];
}

export interface UserStats {
  total_users: number;
  admin_users: number;
  users_with_info: number;
  active_signals: number;
  recent_sos_alerts: number;
}

export interface SosAlert {
  id: string;
  device_id: string;
  user_id: string;
  message: string;
  type: 'sos';
  status: 'online' | 'offline';
  location: {
    latitude: number;
    longitude: number;
  } | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

export class SupabaseDB {
  
  /**
   * Get all users with pagination
   */
  static async getUsers(page: number = 0, limit: number = 10) {
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as User[], count, error: null };
    } catch (error) {
      return { data: null, count: 0, error };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data as User, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return { data: data as User, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as User, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }


  /**
   * Get user information by user ID
   */
  static async getUserInformation(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { data: data as UserInformation, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create or update user information
   */
  static async upsertUserInformation(userId: string, info: Partial<UserInformation>) {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .upsert({
          user_id: userId,
          ...info,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as UserInformation, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete user information
   */
  static async deleteUserInformation(userId: string) {
    try {
      const { error } = await supabase
        .from('user_information')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }


  /**
   * Get users with their information (LEFT JOIN)
   */
  static async getUsersWithInformation(page: number = 0, limit: number = 10) {
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*)
        `, { count: 'exact' })
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithInformation[], count, error: null };
    } catch (error) {
      return { data: null, count: 0, error };
    }
  }

  /**
   * Get user with complete information (user + user_information + esp_signals)
   */
  static async getUserComplete(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*),
          esp_signals (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data as UserComplete, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get users with their ESP signals
   */
  static async getUsersWithSignals() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          esp_signals (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithSignals[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get users who have submitted information
   */
  static async getUsersWithCompleteInformation() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*)
        `)
        .not('user_information', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithInformation[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get users who haven't submitted information
   */
  static async getUsersWithoutInformation() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*)
        `)
        .is('user_information', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithInformation[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }


  /**
   * Get ESP signals with user information
   */
  static async getEspSignalsWithUsers() {
    try {
      const { data, error } = await supabase
        .from('esp_signals')
        .select(`
          *,
          users (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get active ESP signals (online status)
   */
  static async getActiveEspSignals() {
    try {
      const { data, error } = await supabase
        .from('esp_signals')
        .select(`
          *,
          users (*)
        `)
        .eq('status', 'online')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get all signals with user information (includes user details via join)
   */
  static async getSosSignalswithUser(): Promise<{ data: SosAlert[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('esp_signals')
        .select(`*, users(*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) return { data: [], error: null };

      // Remove duplicates by device_id (keep the latest entry for each device)
      const uniqueSignals = data.reduce((acc: any[], current: any) => {
        const existingIndex = acc.findIndex(item => item.device_id === current.device_id);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          if (new Date(current.created_at) > new Date(acc[existingIndex].created_at)) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, []);

      // Filter for SOS messages and structure the data

      // Structure the data for all signals
      const sosAlerts = uniqueSignals
        .map(signal => ({
          id: signal.id || signal.device_id,
          device_id: signal.device_id,
          user_id: signal.user_id,
          message: signal.message,
          type: signal.type || 'sos' as const,
          status: signal.status as 'online' | 'offline',
          location: signal.sensors?.gps || null,
          created_at: signal.created_at,
          user: signal.users ? {
            id: signal.users.id,
            email: signal.users.email,
            first_name: signal.users.first_name,
            last_name: signal.users.last_name,
            phone_number: signal.users.phone_number
          } : undefined
        }));

      return { data: sosAlerts, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }


  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{ data: UserStats | null; error: any }> {
    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get admin users count
      const { count: adminUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);

      // Get users with information count
      const { count: usersWithInfo } = await supabase
        .from('user_information')
        .select('*', { count: 'exact', head: true });

      // Get active signals count
      const { count: activeSignals } = await supabase
        .from('esp_signals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online');

      // Get recent SOS alerts count (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentSosAlerts } = await supabase
        .from('esp_signals')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'sos')
        .gte('created_at', yesterday.toISOString());

      const stats: UserStats = {
        total_users: totalUsers || 0,
        admin_users: adminUsers || 0,
        users_with_info: usersWithInfo || 0,
        active_signals: activeSignals || 0,
        recent_sos_alerts: recentSosAlerts || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithInformation[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get users by blood group
   */
  static async getUsersByBloodGroup(bloodGroup: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*)
        `)
        .eq('user_information.blood_group', bloodGroup)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithInformation[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get users with special needs
   */
  static async getUsersWithSpecialNeeds() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_information (*)
        `)
        .not('user_information.special_needs', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserWithInformation[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }


  /**
   * Create multiple users
   */
  static async createMultipleUsers(users: Partial<User>[]) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(users)
        .select();

      if (error) throw error;
      return { data: data as User[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update multiple users
   */
  static async updateMultipleUsers(updates: { id: string; updates: Partial<User> }[]) {
    try {
      const promises = updates.map(({ id, updates }) =>
        supabase
          .from('users')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }

      const data = results.map(result => result.data?.[0] as User);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create a new SOS alert
   */
  static async createSosAlert(alertData: {
    device_id: string;
    user_id: string;
    message: string;
    type: 'sos';
    status: 'online' | 'offline';
    location?: {
      latitude: number;
      longitude: number;
    };
  }) {
    try {
      const { data, error } = await supabase
        .from('esp_signals')
        .insert({
          device_id: alertData.device_id,
          user_id: alertData.user_id,
          message: alertData.message,
          type: alertData.type,
          status: alertData.status,
          sensors: alertData.location ? {
            gps: {
              latitude: alertData.location.latitude,
              longitude: alertData.location.longitude
            }
          } : null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create a broadcast message (admin alert)
   */
  static async createBroadcastMessage(message: string) {
    try {
      const { data, error } = await supabase
        .from('esp_signals')
        .insert({
          message: message
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create a SOS alert in sos_alerts table
   */
  static async createSosAlertInTable(message: string) {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .insert({
          message: message
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const {
  getUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getUserInformation,
  upsertUserInformation,
  deleteUserInformation,
  getUsersWithInformation,
  getUserComplete,
  getUsersWithSignals,
  getUsersWithCompleteInformation,
  getUsersWithoutInformation,
  getEspSignalsWithUsers,
  getActiveEspSignals,
  getSosSignalswithUser,
  getDashboardStats,
  searchUsers,
  getUsersByBloodGroup,
  getUsersWithSpecialNeeds,
  createMultipleUsers,
  updateMultipleUsers,
  createSosAlert,
  createBroadcastMessage,
  createSosAlertInTable
} = SupabaseDB;
