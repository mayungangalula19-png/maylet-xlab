import { useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { useAuthState } from './useAuthState';

/**
 * Returns the app-wide auth session when inside AuthProvider (preferred).
 * Falls back to a local listener only outside the provider (e.g. tests).
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  return useAuthState();
};
