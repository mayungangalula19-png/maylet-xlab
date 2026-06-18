import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PrototypeIngestionCenter } from '../components/ingestion/PrototypeIngestionCenter';
import { usePrototypeIngestion } from '../hooks/usePrototypeIngestion';
import '../prototype.css';

export default function UploadPrototypePage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const prototypeId = searchParams.get('prototypeId') ?? undefined;
  const ingestion = usePrototypeIngestion(user?.id, prototypeId);

  if (authLoading || ingestion.loading) {
    return (
      <div className="proto-page proto-ingest-page">
        <p>Loading ingestion center…</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="proto-page proto-ingest-page">
        <p>Sign in to import and ingest prototype assets.</p>
        <Link to="/login" className="proto-btn proto-btn--primary">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="proto-page proto-ingest-page">
      <PrototypeIngestionCenter {...ingestion} author={user.email ?? user.id} />
    </div>
  );
}
