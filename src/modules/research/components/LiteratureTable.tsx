import { useCallback, useMemo, useState } from 'react';
import { LITERATURE_TYPE_LABELS } from '../types/research.types';
import type { LiteratureItem, LiteratureType } from '../types/research.types';

const TYPE_ICONS: Record<LiteratureType, string> = {
  paper: '📄',
  journal: '📰',
  white_paper: '📋',
  report: '📊',
  reference: '🔖',
};

const NOTES_PREVIEW_CHARS = 200;

type TypeFilter = 'all' | LiteratureType;
type SortMode = 'relevance' | 'newest' | 'title';

interface Props {
  items: LiteratureItem[];
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatCitations(count: number | null): string {
  if (count == null) return '—';
  return count.toLocaleString();
}

function relevanceTier(score: number | null): 'high' | 'mid' | 'low' | 'none' {
  if (score == null) return 'none';
  if (score >= 70) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export function LiteratureTable({ items, onDelete, disabled, compact }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(() => new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byType = {} as Record<LiteratureType, number>;
    for (const key of Object.keys(LITERATURE_TYPE_LABELS) as LiteratureType[]) {
      byType[key] = 0;
    }
    for (const item of items) {
      byType[item.item_type] += 1;
    }
    return byType;
  }, [items]);

  const avgRelevance = useMemo(() => {
    const scored = items.filter((i) => i.relevance_score != null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((s, i) => s + (i.relevance_score ?? 0), 0);
    return Math.round(sum / scored.length);
  }, [items]);

  const sorted = useMemo(() => {
    const list = [...items];
    if (sort === 'relevance') {
      list.sort((a, b) => (b.relevance_score ?? -1) - (a.relevance_score ?? -1));
    } else if (sort === 'newest') {
      list.sort((a, b) => {
        const da = a.publication_date ?? a.created_at;
        const db = b.publication_date ?? b.created_at;
        return db.localeCompare(da);
      });
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [items, sort]);

  const visible = useMemo(
    () => (typeFilter === 'all' ? sorted : sorted.filter((i) => i.item_type === typeFilter)),
    [sorted, typeFilter]
  );

  const toggleNotes = useCallback((id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setError(null);
      setDeletingId(id);
      try {
        await onDelete(id);
        setConfirmDeleteId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Remove failed');
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const summaryParts = [
    `${items.length} source${items.length === 1 ? '' : 's'}`,
    avgRelevance != null ? `avg relevance ${avgRelevance}` : null,
    items.length > 0 && items.length < 8 ? 'gate target: ≥8 sources' : null,
  ].filter(Boolean);

  return (
    <div className={`research-literature${compact ? ' research-literature--compact' : ''}`}>
      {!compact ? (
        <p className="research-literature__summary">{summaryParts.join(' · ') || 'Track papers, reports, and references'}</p>
      ) : null}

      {error ? (
        <p className="research-literature__error" role="alert">
          {error}
          <button type="button" className="research-literature__error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="research-literature__toolbar">
          <div className="research-literature__filters" role="group" aria-label="Filter literature by type">
            <button
              type="button"
              className={`research-literature__filter${typeFilter === 'all' ? ' research-literature__filter--active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All ({items.length})
            </button>
            {(Object.keys(LITERATURE_TYPE_LABELS) as LiteratureType[]).map((type) =>
              counts[type] > 0 ? (
                <button
                  key={type}
                  type="button"
                  className={`research-literature__filter${typeFilter === type ? ' research-literature__filter--active' : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {TYPE_ICONS[type]} {LITERATURE_TYPE_LABELS[type]} ({counts[type]})
                </button>
              ) : null
            )}
          </div>
          <label className="research-literature__sort">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="research-empty research-literature__empty">
          {items.length === 0
            ? 'No literature yet. Add papers, journals, and reports — gate review targets ≥8 sources with strong relevance scores.'
            : 'No sources match this filter.'}
        </p>
      ) : (
        <ul className="research-literature__list">
          {visible.map((item) => {
            const tier = relevanceTier(item.relevance_score);
            const hasNotes = Boolean(item.notes?.trim());
            const notesExpanded = expandedNotes.has(item.id);
            const notesLong = (item.notes?.length ?? 0) > NOTES_PREVIEW_CHARS;
            const notesBody =
              hasNotes && notesLong && !notesExpanded
                ? `${item.notes!.slice(0, NOTES_PREVIEW_CHARS).trimEnd()}…`
                : item.notes;

            return (
              <li key={item.id} className="research-lit-row">
                <div className="research-lit-row__main">
                  <span className="research-lit-row__icon" aria-hidden>
                    {TYPE_ICONS[item.item_type]}
                  </span>
                  <div className="research-lit-row__body">
                    <div className="research-lit-row__title">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer" title={item.title}>
                          {item.title}
                        </a>
                      ) : (
                        <strong title={item.title}>{item.title}</strong>
                      )}
                      <span className={`research-lit-row__badge research-lit-row__badge--${item.item_type}`}>
                        {LITERATURE_TYPE_LABELS[item.item_type]}
                      </span>
                    </div>
                    <div className="research-lit-row__meta">
                      {item.authors ? <span>{item.authors}</span> : null}
                      {item.authors && item.source ? <span aria-hidden> · </span> : null}
                      {item.source ? <span>{item.source}</span> : null}
                      {(item.authors || item.source) && (item.publication_date || item.citation_count != null) ? (
                        <span aria-hidden> · </span>
                      ) : null}
                      {item.publication_date ? <span>Published {formatDate(item.publication_date)}</span> : null}
                      {item.citation_count != null ? (
                        <span>
                          {item.publication_date ? ' · ' : ''}
                          {formatCitations(item.citation_count)} citations
                        </span>
                      ) : null}
                    </div>
                    {item.relevance_score != null ? (
                      <div className="research-lit-row__relevance">
                        <span className="research-lit-row__relevance-label">Relevance</span>
                        <div className="research-lit-row__relevance-track" aria-hidden>
                          <div
                            className={`research-lit-row__relevance-fill research-lit-row__relevance-fill--${tier}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.relevance_score))}%` }}
                          />
                        </div>
                        <strong className={`research-lit-row__relevance-score research-lit-row__relevance-score--${tier}`}>
                          {item.relevance_score}
                        </strong>
                      </div>
                    ) : (
                      <p className="research-lit-row__relevance-missing">Relevance not scored</p>
                    )}
                    {hasNotes ? (
                      <div className="research-lit-row__notes">
                        <span className="research-lit-row__notes-label">Notes</span>
                        <p>{notesBody}</p>
                        {notesLong ? (
                          <button type="button" className="research-lit-row__notes-toggle" onClick={() => toggleNotes(item.id)}>
                            {notesExpanded ? 'Show less' : 'Show more'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="research-lit-row__actions">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="research-lit-row__link">
                      Open
                    </a>
                  ) : null}
                  {confirmDeleteId === item.id ? (
                    <>
                      <span className="research-lit-row__confirm">Remove?</span>
                      <button
                        type="button"
                        className="research-btn research-btn--danger"
                        disabled={deletingId === item.id || disabled}
                        onClick={() => handleDelete(item.id)}
                      >
                        {deletingId === item.id ? 'Removing…' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        className="research-btn research-btn--secondary"
                        disabled={deletingId === item.id}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="research-btn research-btn--danger research-lit-row__delete"
                      disabled={disabled || deletingId !== null}
                      onClick={() => setConfirmDeleteId(item.id)}
                    >
                      Remove
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
