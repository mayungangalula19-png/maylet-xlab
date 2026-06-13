import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { CreatePrototypeForm } from '../components/CreatePrototypeForm';
import '../prototype.css';

export default function NewPrototype() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? undefined;
  const researchId = searchParams.get('researchId') ?? undefined;

  if (loading) {
    return (
      <div className="proto-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="proto-page">
        <p>Sign in to create a prototype.</p>
      </div>
    );
  }

  return (
    <div className="proto-page">
      <nav className="proto-breadcrumb">
        <Link to="/prototypes">Prototypes</Link>
        <span>/</span>
        <span>New</span>
      </nav>

      <header className="proto-header">
        <div>
          <h1>New Prototype</h1>
          <p>Create a buildable innovation artifact linked to research and projects.</p>
        </div>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">
          ← Back
        </Link>
      </header>

      <div className="proto-panel proto-panel--form">
        <CreatePrototypeForm
          userId={user.id}
          defaultProjectId={projectId}
          defaultResearchId={researchId}
          onSuccess={() => navigate('/prototypes')}
          onCancel={() => navigate('/prototypes')}
        />
      </div>
    </div>
  );
}
