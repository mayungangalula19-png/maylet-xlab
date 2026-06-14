import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminMentors = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'mentor').then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Mentors Management</h1>
      <p>Total Mentors: {users.length}</p>
    </div>
  );
};

export default AdminMentors;
