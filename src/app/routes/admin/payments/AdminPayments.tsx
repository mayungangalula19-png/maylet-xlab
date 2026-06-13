import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const PAGE_SIZE = 25;

interface PaymentRow {
  id: string;
  user_id: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  created_at: string | null;
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const { data, count } = await supabase
        .from('payments')
        .select('id, user_id, amount, currency, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      setPayments(data || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchPage();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Payments Management</h1>
      <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>
        {total} payments · page {page + 1} of {totalPages}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr><th>Date</th><th>Amount</th><th>Status</th><th>User</th></tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
              <td>{p.amount != null ? `${p.amount} ${p.currency || ''}` : '—'}</td>
              <td>{p.status || '—'}</td>
              <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{p.user_id || '—'}</td>
            </tr>
          ))}
          {!loading && payments.length === 0 && (
            <tr><td colSpan={4} style={{ opacity: 0.6, padding: '1rem' }}>No payments found.</td></tr>
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

export default AdminPayments;
