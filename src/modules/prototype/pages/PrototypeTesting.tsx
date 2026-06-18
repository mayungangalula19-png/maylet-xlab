import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PrototypeTestingCenter } from '../components/testing/PrototypeTestingCenter';
import { usePrototypeTestingCenter } from '../hooks/usePrototypeTestingCenter';
import '../prototype.css';

export default function PrototypeTesting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const center = usePrototypeTestingCenter(user?.id, id);

  if (!id) {
    navigate('/prototypes');
    return null;
  }

  if (center.loading) {
    return (
      <div className="proto-page proto-test-page">
        <p>Loading testing center…</p>
      </div>
    );
  }

  if (!center.prototype) {
    return (
      <div className="proto-page proto-test-page">
        <p className="proto-error">Prototype not found.</p>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="proto-page proto-test-page">
      <PrototypeTestingCenter
        {...center}
        author={user?.email ?? user?.id ?? 'Tester'}
        disabled={center.saving}
      />
    </div>
  );
}
