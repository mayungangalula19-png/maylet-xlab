import { createClient } from '@supabase/supabase-js';

const isDev = import.meta.env.DEV;

const supabaseUrl = isDev ? 'http://localhost:3001' : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = isDev ? 'mock-anon-key' : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!isDev && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || 'http://localhost:3001', supabaseAnonKey || 'mock-anon-key');
