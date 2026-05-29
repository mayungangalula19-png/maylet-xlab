import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('payments').select('*').then(({ data }) => setPayments(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Payments Management</h1>
      <p>Total Payments: {payments.length}</p>
    </div>
  );
};

export default AdminPayments;
