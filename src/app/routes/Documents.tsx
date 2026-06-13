import { Navigate, useSearchParams } from 'react-router-dom';

/** Legacy /documents route — redirects to Research Center */
export default function Documents() {
  const [params] = useSearchParams();
  const project = params.get('project');
  if (project) {
    return <Navigate to={`/research/${project}`} replace />;
  }
  return <Navigate to="/research" replace />;
}
