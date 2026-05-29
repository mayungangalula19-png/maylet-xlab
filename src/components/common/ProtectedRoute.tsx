import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';

export const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};
