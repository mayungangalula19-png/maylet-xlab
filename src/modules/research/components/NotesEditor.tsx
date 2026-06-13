import { useState } from 'react';
import { NOTE_CATEGORIES } from '../types/research.types';
import type { ResearchNote } from '../types/research.types';

interface Props {
  notes: ResearchNote[];
  onCreate: (payload: { title: string; content: string; category: string; tags: string[] }) => Promise<void>;
  onUpdate: (id: string, payload: { title: string; content: string; category: string; tags: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotesEditor({ notes, onCreate, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' });

  const reset = () => {
    setEditingId(null);
    setForm({ title: '', content: '', category: 'general', tags: '' });
  };

  const parseTags = () => form.tags.split(',').map((t) => t.trim()).filter(Boolean);

  const submit = async () => {
    if (!form.title.trim()) return;
    const payload = { title: form.title, content: form.content, category: form.category, tags: parseTags() };
    if (editingId) await onUpdate(editingId, payload);
    else await onCreate(payload);
    reset();
  };

  return (
    <>
      <div className="research-card">
        <div className="research-grid-2">
          <div className="research-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="research-field">
          <label>Content</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
        </div>
        <div className="research-field">
          <label>Tags</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma-separated" />
        </div>
        <button type="button" className="research-btn research-btn--primary" onClick={submit}>
          {editingId ? 'Update note' : 'Create note'}
        </button>
        {editingId ? (
          <button type="button" className="research-btn research-btn--secondary" style={{ marginLeft: 8 }} onClick={reset}>
            Cancel
          </button>
        ) : null}
      </div>

      {notes.length === 0 ? (
        <p className="research-empty">No notes yet.</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} className="research-card">
            <div className="research-card-header">
              <h4>{n.title}</h4>
              <div>
                <button
                  type="button"
                  className="research-btn research-btn--secondary"
                  onClick={() => {
                    setEditingId(n.id);
                    setForm({ title: n.title, content: n.content, category: n.category, tags: n.tags.join(', ') });
                  }}
                >
                  Edit
                </button>
                <button type="button" className="research-btn research-btn--danger" style={{ marginLeft: 4 }} onClick={() => onDelete(n.id)}>
                  Delete
                </button>
              </div>
            </div>
            <div className="research-card-meta">
              <span className="research-tag">{n.category}</span>
              {n.tags.map((t) => <span key={t} className="research-tag">{t}</span>)}
            </div>
            <div className="research-card-body">{n.content || '—'}</div>
          </div>
        ))
      )}
    </>
  );
}
