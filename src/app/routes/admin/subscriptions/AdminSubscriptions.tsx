import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('plan').then(({ data }) => setSubscriptions(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Subscriptions Management</h1>
      <p>Total Subscriptions: {subscriptions.length}</p>
    </div>
  );
};

export default AdminSubscriptions;
