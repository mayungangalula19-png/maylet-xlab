import { LITERATURE_TYPE_LABELS } from '../types/research.types';
import type { LiteratureItem } from '../types/research.types';

interface Props {
  items: LiteratureItem[];
  onDelete: (id: string) => Promise<void>;
}

export function LiteratureTable({ items, onDelete }: Props) {
  if (items.length === 0) {
    return <p className="research-empty">No literature items.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="research-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Author</th>
            <th>Source</th>
            <th>Published</th>
            <th>Citations</th>
            <th>Relevance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id}>
              <td>
                {l.url ? (
                  <a href={l.url} target="_blank" rel="noreferrer" style={{ color: '#2fd4ff' }}>{l.title}</a>
                ) : (
                  l.title
                )}
              </td>
              <td>{LITERATURE_TYPE_LABELS[l.item_type]}</td>
              <td>{l.authors ?? '—'}</td>
              <td>{l.source ?? '—'}</td>
              <td>{l.publication_date ?? '—'}</td>
              <td>{l.citation_count ?? '—'}</td>
              <td>{l.relevance_score != null ? `${l.relevance_score}` : '—'}</td>
              <td>
                <button type="button" className="research-btn research-btn--danger" onClick={() => onDelete(l.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
