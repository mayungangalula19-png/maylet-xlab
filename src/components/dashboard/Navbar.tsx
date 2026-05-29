import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase/client';

export const Navbar = () => {
  const { user } = useAuth();
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  return (
    <header className="navbar">
      <span>Welcome, {user?.email}</span>
      <button onClick={signOut}>Sign Out</button>
    </header>
  );
};
