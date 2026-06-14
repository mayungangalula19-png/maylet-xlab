import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminVault = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('vault_items').select('*').then(({ data }) => setItems(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Innovation Vault</h1>
      <p>Total Vault Items: {items.length}</p>
    </div>
  );
};

export default AdminVault;
