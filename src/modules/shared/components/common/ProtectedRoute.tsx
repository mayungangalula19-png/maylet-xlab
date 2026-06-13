import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../../../../contexts/AuthContext';
import { ContentLoader } from './ContentLoader';

/**
 * Route guard for authenticated pages.
 * Uses the app-wide AuthContext (single session fetch + listener).
 */
export const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();

  if (loading) return <ContentLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};
