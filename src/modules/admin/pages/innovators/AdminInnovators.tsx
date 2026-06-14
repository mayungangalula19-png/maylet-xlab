import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminInnovators = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'innovator').then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Innovators Management</h1>
      <p>Total Innovators: {users.length}</p>
    </div>
  );
};

export default AdminInnovators;
