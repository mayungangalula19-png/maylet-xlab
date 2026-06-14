// Shared cross-module UI, hooks, and utilities

export { Button } from './components/ui/Button';
export { Card } from './components/ui/Card';
export { Input } from './components/ui/Input';
export { Modal } from './components/ui/Modal';
export { Alert } from './components/ui/Alert';
export { Spinner } from './components/ui/Spinner';

export { ProtectedRoute } from './components/common/ProtectedRoute';
export { PageLoader } from './components/common/PageLoader';
export { PageShell } from './components/common/PageShell';
export { BrandLogo } from './components/common/BrandLogo';
export { ContentLoader } from './components/common/ContentLoader';
export { ErrorMessage } from './components/common/ErrorMessage';
export { LoadingSpinner } from './components/common/LoadingSpinner';
export { Footer } from './components/common/Footer';

export { DashboardLayout } from './layouts/DashboardLayout';
export { AdminLayout } from './layouts/AdminLayout';

export { useAuth } from './hooks/useAuth';
export { useProfile } from './hooks/useProfile';
export { useProjects } from './hooks/useProjects';
export { useProjectControlCenter } from './hooks/useProjectControlCenter';
export { useProjectStats } from './hooks/useProjectStats';
export { useEnterpriseHub } from './hooks/useEnterpriseHub';
export { useInnovationCommandCenter } from './hooks/useInnovationCommandCenter';
export { useExperiments } from './hooks/useExperiments';
export { useRealtime } from './hooks/useRealtime';
export { useTeams } from './hooks/useTeams';
export { useVault } from './hooks/useVault';

export * from './utils/queryCache';
export * from './utils/formatDate';
export * from './utils/calculateScore';
export * from './utils/validators';

export { supabase } from '../../lib/supabase/client';
export * from '../../lib/supabase/dbHelpers';
