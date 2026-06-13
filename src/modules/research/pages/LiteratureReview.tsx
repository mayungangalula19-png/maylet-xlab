import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LiteratureTable } from '../components/LiteratureTable';
import { useResearch } from '../hooks/useResearch';
import { literatureService } from '../services/literatureService';
import { LITERATURE_TYPE_LABELS } from '../types/research.types';
import type { LiteratureType } from '../types/research.types';
import { getProject } from '../../../services/projects.service';
import { useAuth } from '../../../hooks/useAuth';
import '../research.css';

const EMPTY_FORM = {
  title: '',
  item_type: 'paper' as LiteratureType,
  source: '',
  authors: '',
  publication_date: '',
  citation_count: '',
  relevance_score: '',
  url: '',
  notes: '',
};

export default function LiteratureReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

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

  if (!projectId) return null;

  if (loading || !snapshot) {
    return (
      <div className="research-page">
        <p>Loading literature review…</p>
      </div>
    );
  }

  const userId = user?.id ?? '';

  const submit = async () => {
    if (!form.title.trim()) return;
    await withSaving(() =>
      literatureService.create(projectId, userId, {
        title: form.title,
        item_type: form.item_type,
        source: form.source || null,
        authors: form.authors || null,
        publication_date: form.publication_date || null,
        citation_count: form.citation_count ? Number(form.citation_count) : null,
        relevance_score: form.relevance_score ? Number(form.relevance_score) : null,
        url: form.url || null,
        notes: form.notes || null,
      })
    );
    setForm(EMPTY_FORM);
  };

  return (
    <div className="research-page">
      <nav className="research-breadcrumb">
        <Link to="/research">Research Center</Link>
        <span>/</span>
        <Link to={`/research/${projectId}`}>{projectName}</Link>
        <span>/</span>
        <span>Literature Review</span>
      </nav>

      <header className="research-header">
        <div>
          <h1>Literature Review Center</h1>
          <p>Track sources, citations, and relevance for {projectName}.</p>
        </div>
        <Link to={`/research/${projectId}`} className="research-btn research-btn--secondary">
          Back to workspace
        </Link>
      </header>

      {error ? <p className="research-error">{error}</p> : null}
      {saving ? <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Saving…</p> : null}

      <div className="research-glass research-panel">
        <h2>Add source</h2>
        <div className="research-grid-2">
          <div className="research-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Type</label>
            <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as LiteratureType })}>
              {Object.entries(LITERATURE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="research-field">
            <label>Authors</label>
            <input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Source</label>
            <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Publication date</label>
            <input type="date" value={form.publication_date} onChange={(e) => setForm({ ...form, publication_date: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Citation count</label>
            <input type="number" min={0} value={form.citation_count} onChange={(e) => setForm({ ...form, citation_count: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Relevance score (0–100)</label>
            <input type="number" min={0} max={100} value={form.relevance_score} onChange={(e) => setForm({ ...form, relevance_score: e.target.value })} />
          </div>
          <div className="research-field">
            <label>URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
        </div>
        <div className="research-field">
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </div>
        <button type="button" className="research-btn research-btn--primary" onClick={submit}>
          Add to literature
        </button>
      </div>

      <div className="research-glass research-panel" style={{ marginTop: '1rem' }}>
        <h2>Sources ({snapshot.literature.length})</h2>
        <LiteratureTable
          items={snapshot.literature}
          onDelete={async (id) => {
            await withSaving(() => literatureService.remove(id));
          }}
        />
      </div>
    </div>
  );
}
