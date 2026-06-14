import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminExperiments = () => {
  const [experiments, setExperiments] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('experiments').select('*').then(({ data }) => setExperiments(data || []));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Experiments Management</h1>
      <p>Total Experiments: {experiments.length}</p>
    </div>
  );
};

export default AdminExperiments;
