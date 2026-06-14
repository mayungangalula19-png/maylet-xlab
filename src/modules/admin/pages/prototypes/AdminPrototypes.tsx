import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminPrototypes = () => {
  const [prototypes, setPrototypes] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('prototypes').select('*').then(({ data }) => setPrototypes(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Prototypes Management</h1>
      <p>Total Prototypes: {prototypes.length}</p>
    </div>
  );
};

export default AdminPrototypes;
