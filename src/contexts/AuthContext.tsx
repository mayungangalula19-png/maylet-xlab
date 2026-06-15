import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useAuthState } from '../modules/shared/hooks/useAuthState';
import { supabase } from '../lib/supabase/client';
import { ensureProfileRole } from '../services/auth.service';
import { getCached, setCached } from '../lib/utils/queryCache';

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
      return;
    }

    const cacheKey = `profile-role:${user.id}`;
    const cached = getCached<string>(cacheKey);
    if (cached) {
      setRole(cached);
      return;
    }

    let cancelled = false;
    setRoleLoading(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        let nextRole = data?.role ?? null;

        if (!nextRole) {
          nextRole = await ensureProfileRole(user.id, user.user_metadata);
        }

        if (!nextRole) {
          const retry = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          nextRole = retry.data?.role ?? 'innovator';
        }

        if (cancelled) return;
        setRole(nextRole);
        setCached(cacheKey, nextRole, 300_000);
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    })();

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
