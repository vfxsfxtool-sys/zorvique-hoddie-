import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://zzxkrmsfradeeswqzhfr.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C_SzUwPn2xBbiQQg0tkkaA_4YFJmIpl';

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const FIREBASE_PROJECT_ID = 'zzxkrmsfradeeswqzhfr';

// Compatibility exports for adminApi.ts and errors.ts expecting db and auth
export const db = {
  supabase,
};

export const auth = {
  get currentUser() {
    return null;
  }
};

export async function testConnection(): Promise<void> {
  try {
    await supabase.from('products').select('id').limit(1);
  } catch (error) {
    console.error('Supabase connection error:', error);
  }
}

void testConnection();
