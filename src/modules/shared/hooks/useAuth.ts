// src/modules/shared/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { useAuthState } from './useAuthState';
import { supabase, clearSupabaseCache } from '@/lib/supabase/client';

/**
 * Returns the app-wide auth session when inside AuthProvider (preferred).
 * Falls back to a local listener only outside the provider (e.g. tests).
 * 
 * 🔐 VERSION SECURE – inarudisha logout na clearCache
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  
  // Ikiwa tupo ndani ya AuthProvider, tumia muktadha (una logout na clearCache)
  if (ctx) {
    return ctx;
  }
  
  // Fallback: tumia useAuthState (kwa tests au nje ya provider)
  const state = useAuthState();
  
  // Ongeza logout na clearCache kwa fallback pia
  return {
    ...state,
    role: null,
    roleLoading: false,
    isAdmin: false,
    refreshRole: async () => {},
    logout: async () => {
      // Fanya logout fallback
      await supabase.auth.signOut();
      clearSupabaseCache();
      window.location.href = '/auth/sign-in';
    },
    clearCache: clearSupabaseCache,
  };
};