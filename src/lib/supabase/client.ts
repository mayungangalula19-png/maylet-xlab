import { createClient } from '@supabase/supabase-js';

// In development, use the Vite proxy with an absolute URL.
// In production, use the real Supabase URL.
const supabaseUrl = import.meta.env.DEV
  ? `${window.location.origin}/supabase`  // e.g., http://localhost:5173/supabase
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);