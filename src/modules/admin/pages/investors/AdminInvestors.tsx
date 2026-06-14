import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminInvestors = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'investor').then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Investors Management</h1>
      <p>Total Investors: {users.length}</p>
    </div>
  );
};

export default AdminInvestors;
