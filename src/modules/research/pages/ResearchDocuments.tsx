import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DocumentUploader } from '../components/DocumentUploader';
import { useResearch } from '../hooks/useResearch';
import { documentService } from '../services/documentService';
import { getProject } from '../../../services/projects.service';
import { useAuth } from '../../../hooks/useAuth';
import '../research.css';

export default function ResearchDocuments() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [search, setSearch] = useState('');

  const { snapshot, loading, saving, error, withSaving } = useResearch(user?.id, projectId);

  useEffect(() => {
    if (!projectId) {
      navigate('/research');
      return;
    }
    getProject(projectId)
      .then((p) => setProjectName(p.name))
      .catch(() => setProjectName('Project'));
  }, [projectId, navigate]);

  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const q = search.toLowerCase();
    if (!q) return snapshot.documents;
    return snapshot.documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.category ?? '').toLowerCase().includes(q) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }, [snapshot, search]);

  if (!projectId) return null;

  if (loading || !snapshot) {
    return (
      <div className="research-page">
        <p>Loading documents…</p>
      </div>
    );
  }

  const userId = user?.id ?? '';

  return (
    <div className="research-page">
      <nav className="research-breadcrumb">
        <Link to="/research">Research Center</Link>
        <span>/</span>
        <Link to={`/research/${projectId}`}>{projectName}</Link>
        <span>/</span>
        <span>Documents</span>
      </nav>

      <header className="research-header">
        <div>
          <h1>Research Documents</h1>
          <p>Upload, organize, and access research files for {projectName}.</p>
        </div>
        <Link to={`/research/${projectId}`} className="research-btn research-btn--secondary">
          Back to workspace
        </Link>
      </header>

      {error ? <p className="research-error">{error}</p> : null}
      {saving ? <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Saving…</p> : null}

      <div className="research-search-bar">
        <input
          placeholder="Search documents by name, category, or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="research-glass research-panel">
        <DocumentUploader
          documents={filtered}
          onUpload={async (file) => {
            await withSaving(() => documentService.upload(projectId, userId, file));
          }}
          onDelete={async (id) => {
            await withSaving(() => documentService.remove(id));
          }}
        />
      </div>
    </div>
  );
}
