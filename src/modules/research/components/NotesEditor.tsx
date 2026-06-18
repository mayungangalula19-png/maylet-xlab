import { useCallback, useMemo, useState } from 'react';
import { NOTE_CATEGORIES } from '../types/research.types';
import type { ResearchNote } from '../types/research.types';

const CATEGORY_ICONS: Record<string, string> = {
  general: '📝',
  fieldwork: '🌍',
  interview: '🎤',
  methodology: '🔬',
  data: '📊',
  meeting: '🤝',
};

const CONTENT_PREVIEW_CHARS = 360;
const TITLE_MAX = 200;
const CONTENT_MAX = 8000;

type CategoryFilter = 'all' | (typeof NOTE_CATEGORIES)[number];
type SortMode = 'newest' | 'title';

interface Props {
  notes: ResearchNote[];
  onCreate: (payload: { title: string; content: string; category: string; tags: string[] }) => Promise<void>;
  onUpdate: (id: string, payload: { title: string; content: string; category: string; tags: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function isEvidenceCategory(category: string): boolean {
  return category === 'interview' || category === 'fieldwork';
}

export function NotesEditor({ notes, onCreate, onUpdate, onDelete, disabled }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const cat of NOTE_CATEGORIES) {
      byCategory[cat] = 0;
    }
    for (const note of notes) {
      byCategory[note.category] = (byCategory[note.category] ?? 0) + 1;
    }
    return byCategory;
  }, [notes]);

  const evidenceCount = useMemo(
    () => notes.filter((n) => isEvidenceCategory(n.category)).length,
    [notes]
  );

  const sorted = useMemo(() => {
    const list = [...notes];
    if (sort === 'newest') {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [notes, sort]);

  const visible = useMemo(
    () => (categoryFilter === 'all' ? sorted : sorted.filter((n) => n.category === categoryFilter)),
    [sorted, categoryFilter]
  );

  const busy = disabled || submitting;

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ title: '', content: '', category: 'general', tags: '' });
    setError(null);
  }, []);

  const parseTags = useCallback(
    () =>
      form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [form.tags]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startEdit = useCallback((note: ResearchNote) => {
    setEditingId(note.id);
    setForm({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(', '),
    });
    setShowForm(true);
    setError(null);
  }, []);

  const submit = async () => {
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      setError('Enter a title for this note.');
      return;
    }
    if (title.length > TITLE_MAX) {
      setError(`Title must be ${TITLE_MAX} characters or fewer.`);
      return;
    }
    if (content.length > CONTENT_MAX) {
      setError(`Content must be ${CONTENT_MAX} characters or fewer.`);
      return;
    }

    const payload = {
      title,
      content,
      category: form.category,
      tags: parseTags(),
    };

    setSubmitting(true);
    setError(null);
    try {
      if (editingId) await onUpdate(editingId, payload);
      else await onCreate(payload);
      resetForm();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      setError(null);
      setDeletingId(id);
      try {
        await onDelete(id);
        setConfirmDeleteId(null);
        if (editingId === id) {
          resetForm();
          setShowForm(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete, editingId, resetForm]
  );

  const summaryParts = [
    `${notes.length} note${notes.length === 1 ? '' : 's'}`,
    `${evidenceCount} interview/fieldwork`,
    evidenceCount < 3 ? 'gate target: ≥3 evidence notes' : null,
  ].filter(Boolean);

  return (
    <div className="research-notes">
      <div className="research-panel-header">
        <div>
          <h2>Research notes</h2>
          <p className="research-notes__summary">{summaryParts.join(' · ')}</p>
        </div>
        <button
          type="button"
          className="research-btn research-btn--primary"
          disabled={busy}
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setError(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Close form' : 'Add note'}
        </button>
      </div>

      {error ? (
        <p className="research-notes__error" role="alert">
          {error}
          <button type="button" className="research-notes__error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      {showForm ? (
        <div className="research-card research-notes__form">
          <h3 className="research-notes__form-title">{editingId ? 'Edit note' : 'New note'}</h3>
          <div className="research-grid-2">
            <div className="research-field">
              <label htmlFor="note-title">Title</label>
              <input
                id="note-title"
                value={form.title}
                maxLength={TITLE_MAX}
                disabled={busy}
                placeholder="e.g. User interview — onboarding friction"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <span className="research-notes__counter">
                {form.title.length}/{TITLE_MAX}
              </span>
            </div>
            <div className="research-field">
              <label htmlFor="note-category">Category</label>
              <select
                id="note-category"
                value={form.category}
                disabled={busy}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_ICONS[c]} {categoryLabel(c)}
                  </option>
                ))}
              </select>
              {isEvidenceCategory(form.category) ? (
                <span className="research-notes__evidence-hint">Counts toward gate user evidence (B1)</span>
              ) : null}
            </div>
          </div>
          <div className="research-field">
            <label htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              value={form.content}
              maxLength={CONTENT_MAX}
              disabled={busy}
              rows={6}
              placeholder="Observations, quotes, methodology details, or meeting outcomes…"
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <span className="research-notes__counter">
              {wordCount(form.content)} words · {form.content.length}/{CONTENT_MAX}
            </span>
          </div>
          <div className="research-field">
            <label htmlFor="note-tags">Tags</label>
            <input
              id="note-tags"
              value={form.tags}
              disabled={busy}
              placeholder="comma-separated, e.g. onboarding, healthcare"
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div className="research-notes__form-actions">
            <button
              type="button"
              className="research-btn research-btn--secondary"
              disabled={busy}
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
            <button type="button" className="research-btn research-btn--primary" disabled={busy} onClick={submit}>
              {submitting ? 'Saving…' : editingId ? 'Update note' : 'Save note'}
            </button>
          </div>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <div className="research-notes__toolbar">
          <div className="research-notes__filters" role="group" aria-label="Filter notes by category">
            <button
              type="button"
              className={`research-notes__filter${categoryFilter === 'all' ? ' research-notes__filter--active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              All ({notes.length})
            </button>
            {NOTE_CATEGORIES.map((cat) =>
              counts[cat] > 0 ? (
                <button
                  key={cat}
                  type="button"
                  className={`research-notes__filter research-notes__filter--${cat}${
                    categoryFilter === cat ? ' research-notes__filter--active' : ''
                  }`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {CATEGORY_ICONS[cat]} {categoryLabel(cat)} ({counts[cat]})
                </button>
              ) : null
            )}
          </div>
          <label className="research-notes__sort">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="research-empty research-notes__empty">
          {notes.length === 0
            ? 'No notes yet. Capture interviews, fieldwork, and meetings — gate review requires ≥3 interview/fieldwork notes.'
            : 'No notes match this filter.'}
        </p>
      ) : (
        <ul className="research-notes__list">
          {visible.map((note) => {
            const isLong = note.content.length > CONTENT_PREVIEW_CHARS;
            const expanded = expandedIds.has(note.id);
            const body =
              isLong && !expanded ? `${note.content.slice(0, CONTENT_PREVIEW_CHARS).trimEnd()}…` : note.content;

            return (
              <li key={note.id} className="research-note-row">
                <div className="research-note-row__main">
                  <span className="research-note-row__icon" aria-hidden>
                    {CATEGORY_ICONS[note.category] ?? '📝'}
                  </span>
                  <div className="research-note-row__body">
                    <div className="research-note-row__title">
                      <strong title={note.title}>{note.title}</strong>
                      <span className={`research-note-row__badge research-note-row__badge--${note.category}`}>
                        {categoryLabel(note.category)}
                      </span>
                      {isEvidenceCategory(note.category) ? (
                        <span className="research-note-row__evidence">Gate evidence</span>
                      ) : null}
                    </div>
                    <div className="research-note-row__meta">
                      {formatDate(note.created_at)}
                      {note.content ? ` · ${wordCount(note.content)} words` : ''}
                      {note.updated_at !== note.created_at ? ' · edited' : ''}
                    </div>
                    {note.tags.length > 0 ? (
                      <div className="research-note-row__tags">
                        {note.tags.map((tag) => (
                          <span key={tag} className="research-note-row__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {note.content ? (
                      <div className="research-note-row__content">
                        {body}
                        {isLong ? (
                          <button
                            type="button"
                            className="research-note-row__expand"
                            onClick={() => toggleExpanded(note.id)}
                          >
                            {expanded ? 'Show less' : 'Show more'}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <p className="research-note-row__content research-note-row__content--empty">No content added.</p>
                    )}
                  </div>
                </div>
                <div className="research-note-row__actions">
                  <button
                    type="button"
                    className="research-btn research-btn--secondary research-note-row__edit"
                    disabled={busy || deletingId !== null}
                    onClick={() => startEdit(note)}
                  >
                    Edit
                  </button>
                  {confirmDeleteId === note.id ? (
                    <>
                      <span className="research-note-row__confirm">Delete?</span>
                      <button
                        type="button"
                        className="research-btn research-btn--danger"
                        disabled={deletingId === note.id}
                        onClick={() => handleDelete(note.id)}
                      >
                        {deletingId === note.id ? 'Deleting…' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        className="research-btn research-btn--secondary"
                        disabled={deletingId === note.id}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="research-btn research-btn--danger research-note-row__delete"
                      disabled={busy || deletingId !== null}
                      onClick={() => setConfirmDeleteId(note.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
