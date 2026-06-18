import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { session, user, loading } = useAuthState();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (!user || !session) {
      setRole(null);
      setRoleLoading(false);
      invalidateCache('profile-role:');
      return;
    }

    const cacheKey = `profile-role:${user.id}`;
    let cancelled = false;
    setRoleLoading(true);

    void dedupeAsync(cacheKey, async () => resolveUserRole(user.id, user.user_metadata))
      .then((nextRole) => {
        if (cancelled) return;
        setRole(nextRole);
        setCached(cacheKey, nextRole, 60_000);
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, session]);

  const isAdmin = role === 'admin' || role === 'super_admin';

  const value = useMemo(
    () => ({ session, user, loading, role, roleLoading, isAdmin }),
    [session, user, loading, role, roleLoading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
