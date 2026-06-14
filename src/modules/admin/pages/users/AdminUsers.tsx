import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';

const PAGE_SIZE = 25;

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const { data, count } = await supabase
        .from('profiles')
        .select('id, full_name, email, role', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      setUsers(data || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchPage();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ padding: '2rem' }}>
      <h1>User Management</h1>
      <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>
        {total} users · page {page + 1} of {totalPages}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.full_name || 'N/A'}</td>
              <td>{user.email}</td>
              <td>{user.role || 'user'}</td>
              <td><Link to={`/admin/users/${user.id}`}>View</Link></td>
            </tr>
          ))}
          {!loading && users.length === 0 && (
            <tr><td colSpan={4} style={{ opacity: 0.6, padding: '1rem' }}>No users found.</td></tr>
          )}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
          ← Previous
        </button>
        <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages || loading}>
          Next →
        </button>
        {loading && <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>Loading…</span>}
      </div>
    </div>
  );
};

export default AdminUsers;
