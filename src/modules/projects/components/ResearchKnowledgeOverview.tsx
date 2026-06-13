import { Link } from 'react-router-dom';
import type { KnowledgeOverview } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  knowledge: KnowledgeOverview;
}

export function ResearchKnowledgeOverview({ knowledge }: Props) {
  const stats = [
    { label: 'Research Papers', value: knowledge.researchPapers, route: '/documents' },
    { label: 'Research Notes', value: knowledge.researchNotes, route: '/documents' },
    { label: 'Literature Reviews', value: knowledge.literatureReviews, route: '/documents' },
    { label: 'Uploaded Documents', value: knowledge.uploadedDocuments, route: '/documents' },
    { label: 'Knowledge Growth', value: `${knowledge.knowledgeBaseGrowth}%`, route: '/learning' },
  ];

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Research & Knowledge</h3>
        <Link to="/documents" className="icc-widget-link">Knowledge Base</Link>
      </div>
      <div className="icc-knowledge-stats">
        {stats.map((s) => (
          <Link key={s.label} to={s.route} className="icc-knowledge-stat icc-clickable">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </Link>
        ))}
      </div>
      {knowledge.recentItems.length > 0 ? (
        knowledge.recentItems.slice(0, 3).map((doc) => (
          <Link
            key={doc.id}
            to={doc.project_id ? `/projects/${doc.project_id}` : '/documents'}
            className="icc-doc-item icc-clickable"
          >
            <div style={{ fontWeight: 600 }}>{doc.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              {doc.file_type ?? 'Document'}
            </div>
          </Link>
        ))
      ) : (
        <Link to="/documents" className="icc-widget-cta">Add research content →</Link>
      )}
    </div>
  );
}
