import { supabase } from '@/lib/supabase';

// Generic database service functions
export const dbService = {
  // Generic create function
  async create<T>(table: string, data: any) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Generic read function
  async read<T>(table: string, filters?: Record<string, any>) {
    try {
      let query = supabase.from(table).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Generic update function
  async update<T>(table: string, id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Generic delete function
  async delete(table: string, id: string) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Generic batch operations
  async batchCreate<T>(table: string, dataArray: any[]) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(dataArray)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Generic batch update
  async batchUpdate<T>(table: string, updates: any[], idField: string = 'id') {
    try {
      const promises = updates.map(update => 
        supabase
          .from(table)
          .update(update)
          .eq(idField, update[idField])
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        return { data: null, error: errors[0].error };
      }
      
      return { data: results.map(r => r.data), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
