import { memo, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/dashboard/AdminSidebar';
import { ContentLoader } from '../../components/common/ContentLoader';

/**
 * Layout for all admin pages.
 * Sidebar stays mounted; only the Outlet content suspends on route change.
 */
export const AdminLayout = memo(function AdminLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0' }}>
      <AdminSidebar />
      <div className="layout-content">
        <Suspense fallback={<ContentLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
});

export default AdminLayout;
