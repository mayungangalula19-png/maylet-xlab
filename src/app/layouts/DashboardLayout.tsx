import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../../components/dashboard/AppSidebar';

export const DashboardLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0' }}>
      <AppSidebar />
      <div className="dashboard-layout" style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};
