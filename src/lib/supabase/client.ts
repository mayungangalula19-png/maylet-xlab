// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.DEV
  ? `${window.location.origin}/supabase`  // proxy ya development
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// ✅ MUHIMU: Weka storageKey maalum kwa mradi wako
// Hii inazuia migongano na apps nyingine kwenye domain moja
const STORAGE_KEY = 'maya-ai-auth'; // Badili jina kama unavyotaka

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_KEY, // ✅ MUHIMU SANA
    flowType: 'pkce',
  },
});

// Kazi ya kusafisha cache yote inayohusiana na Supabase
export const clearSupabaseCache = () => {
  // Futa localStorage keys zinazoanza na 'sb-' au zilizo na jina la storageKey
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase') || key === STORAGE_KEY) {
      localStorage.removeItem(key);
    }
  });
  // Pia futa sessionStorage
  sessionStorage.clear();
};