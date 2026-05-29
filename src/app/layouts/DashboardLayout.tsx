import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Outlet />
    </div>
  );
};
