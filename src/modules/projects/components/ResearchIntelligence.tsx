import { Link } from 'react-router-dom';
import type { KnowledgeOverview } from '../../../lib/supabase/commandCenter.queries';
import type { ResearchAnalytics } from '../../../lib/innovation/dashboardAnalytics';

interface Props {
  knowledge: KnowledgeOverview;
  analytics: ResearchAnalytics;
}

export function ResearchIntelligence({ knowledge, analytics }: Props) {
  return (
    <div className="icc-glass icc-widget icc-research-intel">
      <div className="icc-widget-header">
        <h3>Research Intelligence</h3>
        <Link to="/documents" className="icc-widget-link">Knowledge Base</Link>
      </div>

      <div className="icc-research-metrics">
        <Link to="/documents" className="icc-research-metric icc-clickable">
          <strong>{knowledge.researchPapers}</strong>
          <span>Papers</span>
        </Link>
        <Link to="/documents" className="icc-research-metric icc-clickable">
          <strong>{knowledge.researchNotes}</strong>
          <span>Notes</span>
        </Link>
        <Link to="/documents" className="icc-research-metric icc-clickable">
          <strong>{knowledge.literatureReviews}</strong>
          <span>Lit. Reviews</span>
        </Link>
        <Link to="/documents" className="icc-research-metric icc-clickable">
          <strong>{knowledge.uploadedDocuments}</strong>
          <span>Documents</span>
        </Link>
      </div>

      <div className="icc-research-analytics">
        <div className="icc-research-analytic">
          <span>Research Completion</span>
          <div className="icc-bar-track">
            <div className="icc-bar-fill" style={{ width: `${analytics.researchCompletion}%` }} />
          </div>
          <strong>{analytics.researchCompletion}%</strong>
        </div>
        <Link to="/documents" className="icc-research-analytic icc-clickable">
          <span>Citation Count</span>
          <strong>{analytics.citationCount}</strong>
        </Link>
        <div className="icc-research-analytic">
          <span>Research Quality Score</span>
          <strong>{analytics.researchQualityScore}/100</strong>
        </div>
        <div className="icc-research-analytic">
          <span>Knowledge Base Growth</span>
          <div className="icc-bar-track">
            <div className="icc-bar-fill" style={{ width: `${knowledge.knowledgeBaseGrowth}%`, background: '#2fd4ff' }} />
          </div>
          <strong>{knowledge.knowledgeBaseGrowth}%</strong>
        </div>
      </div>

      {knowledge.recentItems.length > 0 && (
        <ul className="icc-research-recent">
          {knowledge.recentItems.slice(0, 3).map((doc) => (
            <li key={doc.id}>
              <Link to="/documents" className="icc-clickable">{doc.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
