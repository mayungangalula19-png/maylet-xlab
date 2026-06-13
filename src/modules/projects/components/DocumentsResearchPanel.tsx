import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../../../lib/innovation/lifecycle';
import type { DocumentPreview } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  documents: DocumentPreview[];
}

const PLACEHOLDER_LINKS = [
  { label: 'Research Note', route: '/documents' },
  { label: 'Proposal', route: '/documents' },
  { label: 'Literature Review', route: '/documents' },
  { label: 'Document', route: '/documents' },
];

export function DocumentsResearchPanel({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <div className="icc-glass icc-widget">
        <div className="icc-widget-header">
          <h3>Research & Documents</h3>
          <Link to="/documents" className="icc-widget-link">View All</Link>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem' }}>
          Upload research notes, proposals, and literature reviews to track your innovation journey.
        </p>
        {PLACEHOLDER_LINKS.map((item) => (
          <Link key={item.label} to={item.route} className="icc-doc-item icc-clickable">
            <div style={{ fontWeight: 600 }}>Upload {item.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
              Tap to add to your vault
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Research & Documents</h3>
        <Link to="/documents" className="icc-widget-link">View All</Link>
      </div>
      {documents.slice(0, 4).map((doc) => (
        <Link
          key={doc.id}
          to={doc.project_id ? `/projects/${doc.project_id}` : '/documents'}
          className="icc-doc-item icc-clickable"
          title={doc.name}
        >
          <div style={{ fontWeight: 600 }}>{doc.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
            {doc.file_type ?? 'Document'} · {formatTimeAgo(doc.created_at)}
          </div>
        </Link>
      ))}
      <Link to="/documents" className="icc-widget-cta">
        Upload new document →
      </Link>
    </div>
  );
}
