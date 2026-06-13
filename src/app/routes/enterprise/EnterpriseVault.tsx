import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  createVaultEntry,
  deleteVaultEntry,
  loadEnterpriseKnowledgeVault,
  updateVaultEntry,
} from '../../../lib/enterprise/enterpriseHub.service';
import type { EnterpriseVaultRow } from '../../../types/enterpriseHub.types';
import { formatTimeAgo } from '../../../lib/innovation/lifecycle';

interface VaultFormState {
  title: string;
  description: string;
  is_confidential: boolean;
  tags: string;
}

const EMPTY_FORM: VaultFormState = {
  title: '',
  description: '',
  is_confidential: true,
  tags: '',
};

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function EnterpriseVault() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<EnterpriseVaultRow[]>([]);
  const [documents, setDocuments] = useState<
    Awaited<ReturnType<typeof loadEnterpriseKnowledgeVault>>['documents']
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VaultFormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await loadEnterpriseKnowledgeVault(user.id);
      setEntries(data.entries);
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enterprise vault');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [user, authLoading, load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMessage(null);
  };

  const openEdit = (entry: EnterpriseVaultRow) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      description: entry.description ?? '',
      is_confidential: entry.is_confidential,
      tags: '',
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        is_confidential: form.is_confidential,
        tags: parseTags(form.tags),
      };
      if (editingId) {
        await updateVaultEntry(user.id, editingId, payload);
        setMessage('Vault entry updated.');
      } else {
        await createVaultEntry(user.id, payload);
        setMessage('Vault entry created.');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    if (!window.confirm('Delete this vault entry? This cannot be undone.')) return;
    setError(null);
    try {
      await deleteVaultEntry(user.id, entryId);
      setMessage('Vault entry deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="ev-page">
        <div className="ev-loading" aria-label="Loading enterprise vault" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ev-page">
        <p className="ev-error">Sign in to access the enterprise knowledge vault.</p>
        <Link to="/login">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="ev-page">
      <header className="ev-header">
        <div>
          <Link to="/enterprise" className="ev-back">
            ← Enterprise Hub
          </Link>
          <h1>Enterprise Knowledge Vault</h1>
          <p>Protected IP records and project documents for your organization.</p>
        </div>
        <div className="ev-header__actions">
          <button type="button" className="ev-btn ev-btn--primary" onClick={openCreate}>
            + New IP record
          </button>
          <Link to="/vault/save" className="ev-btn ev-btn--ghost">
            Full idea capture
          </Link>
        </div>
      </header>

      {error && <div className="ev-banner ev-banner--error">{error}</div>}
      {message && <div className="ev-banner ev-banner--success">{message}</div>}

      <section className="ev-section">
        <div className="ev-section__head">
          <h2>Protected IP ({entries.length})</h2>
        </div>
        {entries.length === 0 ? (
          <div className="ev-empty">
            <p>No protected IP records yet.</p>
            <button type="button" className="ev-btn ev-btn--primary" onClick={openCreate}>
              Create first record
            </button>
          </div>
        ) : (
          <ul className="ev-list">
            {entries.map((entry) => (
              <li key={entry.id} className="ev-card">
                <div>
                  <strong>{entry.title}</strong>
                  {entry.is_confidential && <span className="ev-pill">Confidential</span>}
                  <p>{entry.description ?? 'No description'}</p>
                  <span className="ev-muted">{formatTimeAgo(entry.created_at)}</span>
                </div>
                <div className="ev-card__actions">
                  <button type="button" className="ev-btn ev-btn--ghost" onClick={() => openEdit(entry)}>
                    Edit
                  </button>
                  <button type="button" className="ev-btn ev-btn--danger" onClick={() => handleDelete(entry.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ev-section">
        <div className="ev-section__head">
          <h2>Project documents ({documents.length})</h2>
          <Link to="/documents" className="ev-btn ev-btn--ghost">
            Document center
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="ev-empty">
            <p>No project documents uploaded yet.</p>
            <Link to="/documents" className="ev-btn ev-btn--ghost">
              Open documents
            </Link>
          </div>
        ) : (
          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td>
                      {doc.project_name ? (
                        <Link to={`/projects/${doc.project_id}`}>{doc.project_name}</Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{doc.file_type ?? '—'}</td>
                    <td>{formatTimeAgo(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="ev-modal" role="dialog" aria-modal="true">
          <div className="ev-modal__card">
            <div className="ev-modal__head">
              <h3>{editingId ? 'Edit IP record' : 'New IP record'}</h3>
              <button type="button" className="ev-modal__close" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="ev-field">
                <span>Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>
              <label className="ev-field">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="ev-field">
                <span>Tags (comma-separated)</span>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="patent, trade-secret, prototype"
                />
              </label>
              <label className="ev-check">
                <input
                  type="checkbox"
                  checked={form.is_confidential}
                  onChange={(e) => setForm({ ...form, is_confidential: e.target.checked })}
                />
                Mark as confidential
              </label>
              <div className="ev-modal__foot">
                <button type="button" className="ev-btn ev-btn--ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="ev-btn ev-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update record' : 'Create record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ev-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem 3rem;
          color: #e8e8f0;
        }
        .ev-back { color: #9b7ff0; text-decoration: none; font-size: 0.85rem; }
        .ev-back:hover { text-decoration: underline; }
        .ev-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .ev-header h1 {
          margin: 0.35rem 0 0.25rem;
          font-size: 1.65rem;
          background: linear-gradient(135deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ev-header p { margin: 0; opacity: 0.65; font-size: 0.9rem; }
        .ev-header__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .ev-btn {
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: #e8e8f0;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          font-size: 0.82rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .ev-btn--primary {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border-color: transparent;
        }
        .ev-btn--ghost:hover { background: rgba(255,255,255,0.1); }
        .ev-btn--danger {
          border-color: rgba(252,129,129,0.35);
          color: #feb2b2;
        }
        .ev-section {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 1rem 1.1rem;
          margin-bottom: 1rem;
        }
        .ev-section__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .ev-section h2 { margin: 0; font-size: 1rem; }
        .ev-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.65rem; }
        .ev-card {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem;
          border-radius: 10px;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .ev-card strong { display: block; margin-bottom: 0.2rem; }
        .ev-card p { margin: 0.25rem 0; opacity: 0.75; font-size: 0.85rem; }
        .ev-card__actions { display: flex; gap: 0.4rem; align-items: flex-start; }
        .ev-pill {
          margin-left: 0.45rem;
          font-size: 0.68rem;
          padding: 0.12rem 0.4rem;
          border-radius: 999px;
          background: rgba(252,129,129,0.15);
          color: #feb2b2;
        }
        .ev-muted { opacity: 0.55; font-size: 0.78rem; }
        .ev-empty {
          text-align: center;
          padding: 1.5rem;
          opacity: 0.8;
        }
        .ev-table-wrap { overflow-x: auto; }
        .ev-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .ev-table th, .ev-table td {
          text-align: left;
          padding: 0.55rem 0.45rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ev-table a { color: #9b7ff0; text-decoration: none; }
        .ev-banner {
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          margin-bottom: 0.85rem;
          font-size: 0.85rem;
        }
        .ev-banner--error { background: rgba(252,129,129,0.12); color: #feb2b2; }
        .ev-banner--success { background: rgba(104,211,145,0.12); color: #9ae6b4; }
        .ev-loading {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #9b7ff0;
          border-radius: 50%;
          animation: ev-spin 0.8s linear infinite;
          margin: 4rem auto;
        }
        @keyframes ev-spin { to { transform: rotate(360deg); } }
        .ev-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .ev-modal__card {
          width: min(480px, 100%);
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 1rem;
        }
        .ev-modal__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .ev-modal__head h3 { margin: 0; }
        .ev-modal__close {
          background: none;
          border: none;
          color: #e8e8f0;
          font-size: 1.4rem;
          cursor: pointer;
        }
        .ev-field { display: block; margin-bottom: 0.75rem; }
        .ev-field span { display: block; font-size: 0.78rem; opacity: 0.7; margin-bottom: 0.3rem; }
        .ev-field input, .ev-field textarea {
          width: 100%;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #e8e8f0;
          padding: 0.5rem 0.65rem;
        }
        .ev-check {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.85rem;
          margin-bottom: 0.85rem;
        }
        .ev-modal__foot { display: flex; justify-content: flex-end; gap: 0.5rem; }
      `}</style>
    </div>
  );
}
