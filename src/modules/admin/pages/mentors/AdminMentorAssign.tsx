import { Navigate, useParams } from 'react-router-dom';

export default function AdminMentorAssign() {
  const { id } = useParams();
  if (!id) return <Navigate to="/admin/mentors" replace />;
  return <Navigate to={`/admin/mentors?mentor=${id}&tab=matching`} replace />;
}
