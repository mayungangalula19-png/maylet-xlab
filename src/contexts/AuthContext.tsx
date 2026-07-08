import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useAuthState } from '../modules/shared/hooks/useAuthState';
import { resolveUserRole } from '../services/auth.service';
import { dedupeAsync, invalidateCache, setCached } from '../lib/utils/queryCache';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string | null;
  roleLoading: boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { session, user, loading } = useAuthState();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<boolean>(false);

  // ── Fetch role ──
  const fetchRole = useCallback(
    async (userId: string) => {
      const cacheKey = `profile-role:${userId}`;
      // Invalidate cache to force fresh fetch
      invalidateCache(cacheKey);
      console.log('[AuthContext] Fetching role for user:', userId);

      try {
        const nextRole = await dedupeAsync(cacheKey, async () => {
          return resolveUserRole(userId, user?.user_metadata);
        });
        console.log('[AuthContext] Role resolved:', nextRole);
        setRole(nextRole);
        setCached(cacheKey, nextRole, 60_000);
        return nextRole;
      } catch (error) {
        console.error('[AuthContext] Error fetching role:', error);
        setRole(null);
        return null;
      }
    },
    [user?.user_metadata]
  );

  // ── Refresh role (manual) ──
  const refreshRole = useCallback(async () => {
    if (!user) return;
    console.log('[AuthContext] Manual refreshRole called');
    setRoleLoading(true);
    try {
      await fetchRole(user.id);
    } finally {
      setRoleLoading(false);
    }
  }, [user, fetchRole]);

  // ── Fetch role on user change ──
  useEffect(() => {
    if (!user || !session) {
      setRole(null);
      setRoleLoading(false);
      invalidateCache('profile-role:');
      return;
    }

    let isMounted = true;
    // Immediately set loading=true so AdminRoute waits for us
    setRoleLoading(true);
    console.log('[AuthContext] User detected, setting roleLoading=true, fetching role...');

    fetchRole(user.id)
      .catch((err) => {
        if (isMounted) {
          console.error('[AuthContext] Unhandled fetch error:', err);
          setRole(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          console.log('[AuthContext] Setting roleLoading to false');
          setRoleLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, session, fetchRole]);

  // ── Computed ──
  const isAdmin = role === 'admin' || role === 'super_admin';

  // ── Log role changes ──
  useEffect(() => {
    console.log('[AuthContext] Role changed:', role);
    console.log('[AuthContext] isAdmin:', isAdmin);
  }, [role, isAdmin]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      role,
      roleLoading,
      isAdmin,
      refreshRole,
    }),
    [session, user, loading, role, roleLoading, isAdmin, refreshRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};