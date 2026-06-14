import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase/client';

const AdminAnalytics = () => {
  const [stats, setStats] = useState({ users: 0, projects: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true })
    ]).then(([users, projects]) => {
      setStats({ users: users.count || 0, projects: projects.count || 0 });
    });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Analytics Dashboard</h1>
      <p>Total Users: {stats.users}</p>
      <p>Total Projects: {stats.projects}</p>
    </div>
  );
};

export default AdminAnalytics;
