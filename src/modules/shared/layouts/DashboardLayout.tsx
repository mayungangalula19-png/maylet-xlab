import { memo, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../../dashboard/components/AppSidebar';
import { ContentLoader } from '../components/common/ContentLoader';

/**
 * Layout for all authenticated user pages.
 * Sidebar stays mounted; only the Outlet content suspends on route change.
 */
export const DashboardLayout = memo(function DashboardLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0' }}>
      <AppSidebar />
      <div className="layout-content">
        <Suspense fallback={<ContentLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
});
