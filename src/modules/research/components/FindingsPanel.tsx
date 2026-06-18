import { useCallback, useMemo, useState } from 'react';
import { FINDING_TYPE_LABELS } from '../types/research.types';
import type { FindingType, ResearchFinding } from '../types/research.types';

const FINDING_TYPE_ICONS: Record<FindingType, string> = {
  finding: '🔍',
  observation: '👁',
  insight: '💡',
  conclusion: '✓',
};

const CONTENT_PREVIEW_CHARS = 360;
const TITLE_MAX = 200;
const CONTENT_MAX = 8000;

type TypeFilter = 'all' | FindingType;

interface Props {
  findings: ResearchFinding[];
  onCreate: (payload: { title: string; content: string; finding_type: FindingType }) => Promise<void>;
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

export function FindingsPanel({ findings, onCreate, onDelete, disabled }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [form, setForm] = useState({ title: '', content: '', finding_type: 'finding' as FindingType });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byType: Record<FindingType, number> = {
      finding: 0,
      observation: 0,
      insight: 0,
      conclusion: 0,
    };
    for (const f of findings) {
      byType[f.finding_type] += 1;
    }
    return byType;
  }, [findings]);

  const sorted = useMemo(
    () => [...findings].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [findings]
  );

  const visible = useMemo(
    () => (typeFilter === 'all' ? sorted : sorted.filter((f) => f.finding_type === typeFilter)),
    [sorted, typeFilter]
  );

  const busy = disabled || submitting;

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const submit = async () => {
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      setError('Enter a title for this finding.');
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

    setError(null);
    setSubmitting(true);
    try {
      await onCreate({ title, content, finding_type: form.finding_type });
      setForm({ title: '', content: '', finding_type: 'finding' });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save finding');
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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const summaryParts = [
    `${findings.length} recorded`,
    counts.insight > 0 ? `${counts.insight} insight${counts.insight === 1 ? '' : 's'}` : null,
    counts.conclusion > 0 ? `${counts.conclusion} conclusion${counts.conclusion === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  return (
    <div className="research-findings">
      <div className="research-panel-header">
        <div>
          <h2>Research findings</h2>
          <p className="research-findings__summary">{summaryParts.join(' · ') || 'Capture evidence-backed takeaways'}</p>
        </div>
        <button
          type="button"
          className="research-btn research-btn--primary"
          disabled={busy}
          onClick={() => {
            setError(null);
            setShowForm((v) => !v);
          }}
        >
          {showForm ? 'Close form' : 'Add finding'}
        </button>
      </div>

      {error ? (
        <p className="research-findings__error" role="alert">
          {error}
          <button type="button" className="research-findings__error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      {showForm ? (
        <div className="research-card research-findings__form">
          <div className="research-grid-2">
            <div className="research-field">
              <label htmlFor="finding-title">Title</label>
              <input
                id="finding-title"
                value={form.title}
                maxLength={TITLE_MAX}
                disabled={busy}
                placeholder="e.g. Users abandon onboarding at step 3"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <span className="research-findings__counter">
                {form.title.length}/{TITLE_MAX}
              </span>
            </div>
            <div className="research-field">
              <label htmlFor="finding-type">Type</label>
              <select
                id="finding-type"
                value={form.finding_type}
                disabled={busy}
                onChange={(e) => setForm({ ...form, finding_type: e.target.value as FindingType })}
              >
                {Object.entries(FINDING_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="research-field">
            <label htmlFor="finding-content">Content</label>
            <textarea
              id="finding-content"
              value={form.content}
              maxLength={CONTENT_MAX}
              disabled={busy}
              rows={5}
              placeholder="What did you learn? Include evidence, quotes, or metrics where possible."
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <span className="research-findings__counter">
              {wordCount(form.content)} words · {form.content.length}/{CONTENT_MAX}
            </span>
          </div>
          <div className="research-findings__form-actions">
            <button
              type="button"
              className="research-btn research-btn--secondary"
              disabled={busy}
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className="research-btn research-btn--primary" disabled={busy} onClick={submit}>
              {submitting ? 'Saving…' : 'Save finding'}
            </button>
          </div>
        </div>
      ) : null}

      {findings.length > 0 ? (
        <div className="research-findings__toolbar">
          <span className="research-findings__toolbar-label">Filter by type</span>
          <div className="research-findings__filters" role="group" aria-label="Filter findings by type">
            <button
              type="button"
              className={`research-findings__filter${typeFilter === 'all' ? ' research-findings__filter--active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All ({findings.length})
            </button>
            {(Object.keys(FINDING_TYPE_LABELS) as FindingType[]).map((type) =>
              counts[type] > 0 ? (
                <button
                  key={type}
                  type="button"
                  className={`research-findings__filter research-findings__filter--${type}${
                    typeFilter === type ? ' research-findings__filter--active' : ''
                  }`}
                  onClick={() => setTypeFilter(type)}
                >
                  {FINDING_TYPE_ICONS[type]} {FINDING_TYPE_LABELS[type]} ({counts[type]})
                </button>
              ) : null
            )}
          </div>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="research-empty research-findings__empty">
          {findings.length === 0
            ? 'No findings yet. Document interviews, field notes, and analysis as structured findings for gate review.'
            : 'No findings match this filter.'}
        </p>
      ) : (
        <ul className="research-findings__list">
          {visible.map((f) => {
            const isLong = f.content.length > CONTENT_PREVIEW_CHARS;
            const expanded = expandedIds.has(f.id);
            const body = isLong && !expanded ? `${f.content.slice(0, CONTENT_PREVIEW_CHARS).trimEnd()}…` : f.content;

            return (
              <li key={f.id} className="research-finding-row">
                <div className="research-finding-row__main">
                  <span className="research-finding-row__icon" aria-hidden>
                    {FINDING_TYPE_ICONS[f.finding_type]}
                  </span>
                  <div className="research-finding-row__body">
                    <div className="research-finding-row__title">
                      <strong title={f.title}>{f.title}</strong>
                      <span className={`research-finding-row__badge research-finding-row__badge--${f.finding_type}`}>
                        {FINDING_TYPE_LABELS[f.finding_type]}
                      </span>
                    </div>
                    <div className="research-finding-row__meta">
                      Recorded {formatDate(f.created_at)}
                      {f.content ? ` · ${wordCount(f.content)} words` : ''}
                    </div>
                    {f.content ? (
                      <div className="research-finding-row__content">
                        {body}
                        {isLong ? (
                          <button
                            type="button"
                            className="research-finding-row__expand"
                            onClick={() => toggleExpanded(f.id)}
                          >
                            {expanded ? 'Show less' : 'Show more'}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <p className="research-finding-row__content research-finding-row__content--empty">No detail added.</p>
                    )}
                  </div>
                </div>
                <div className="research-finding-row__actions">
                  {confirmDeleteId === f.id ? (
                    <>
                      <span className="research-finding-row__confirm-label">Delete?</span>
                      <button
                        type="button"
                        className="research-btn research-btn--danger"
                        disabled={deletingId === f.id}
                        onClick={() => handleDelete(f.id)}
                      >
                        {deletingId === f.id ? 'Deleting…' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        className="research-btn research-btn--secondary"
                        disabled={deletingId === f.id}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="research-btn research-btn--danger research-finding-row__delete"
                      disabled={deletingId !== null}
                      onClick={() => setConfirmDeleteId(f.id)}
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
