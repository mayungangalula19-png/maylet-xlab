import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/dashboard/AdminSidebar';

export function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
