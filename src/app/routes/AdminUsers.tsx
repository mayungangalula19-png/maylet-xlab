import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>User Management</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td>{user.full_name || 'N/A'}</td>
              <td>{user.email}</td>
              <td>{user.role || 'user'}</td>
              <td><Link to={`/admin/users/${user.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
