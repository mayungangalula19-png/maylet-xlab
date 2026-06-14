import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getProfile } from '../../../services/auth.service';
import { supabase } from '../../../lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  user_type: string | null;
  organization_name: string | null;
  bio: string | null;
  plan: string | null;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dna, setDna] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(authLoading);
      return;
    }
    setLoading(true);
    Promise.all([
      getProfile(user.id).catch(() => null),
      supabase.from('dna_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]).then(([p, dnaRes]) => {
      if (p) setProfile(p as UserProfile);
      if (dnaRes.data) setDna(dnaRes.data as Record<string, unknown>);
      setLoading(false);
    });
  }, [user?.id, authLoading]);

  return { profile, dna, loading, user };
}
