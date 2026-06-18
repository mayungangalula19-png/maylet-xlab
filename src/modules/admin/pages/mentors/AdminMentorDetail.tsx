import { Navigate, useParams, useSearchParams } from 'react-router-dom';

export default function AdminMentorDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const tab = params.get('tab');
  if (!id) return <Navigate to="/admin/mentors" replace />;
  const query = tab ? `?mentor=${id}&tab=${tab}` : `?mentor=${id}`;
  return <Navigate to={`/admin/mentors${query}`} replace />;
}
