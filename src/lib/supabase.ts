import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://zzxkrmsfradeeswqzhfr.supabase.co';
const defaultAnonKey = 'sb_publishable_C_SzUwPn2xBbiQQg0tkkaA_4YFJmIpl';

export const getSupabaseConfig = () => {
  const url = localStorage.getItem('zorvique_supabase_url') || import.meta.env.VITE_SUPABASE_URL || defaultUrl;
  const anonKey = localStorage.getItem('zorvique_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;
  return { url, anonKey };
};

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';

export const getSupabaseClient = (): SupabaseClient => {
  const { url, anonKey } = getSupabaseConfig();
  if (cachedClient && cachedUrl === url) {
    return cachedClient;
  }
  cachedUrl = url;
  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cachedClient;
};

export const supabase = getSupabaseClient();
