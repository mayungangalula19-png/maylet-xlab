import { Link } from 'react-router-dom';
import type { ResearchLinkSummary } from '../types/prototype.types';

interface Props {
  summary: ResearchLinkSummary | null;
  prototypeName: string;
}

export function ResearchLinkPanel({ summary, prototypeName }: Props) {
  if (!summary?.projectId) {
    return (
      <section className="proto-panel">
        <h3>Research connection</h3>
        <p>No linked research. Create from Research module or link a project when creating this prototype.</p>
      </section>
    );
  }

  return (
    <section className="proto-panel">
      <h3>Research connection</h3>
      <p className="proto-panel-sub">
        <strong>{prototypeName}</strong> traces back to project research.
      </p>
      <ul className="proto-research-stats">
        <li>{summary.findingsCount} findings</li>
        <li>{summary.documentsCount} documents</li>
        <li>{summary.notesCount} notes</li>
      </ul>
      {summary.problemStatement && (
        <p className="proto-research-problem">{summary.problemStatement.slice(0, 200)}…</p>
      )}
      <Link to={`/research/${summary.projectId}`} className="proto-btn proto-btn--ghost">
        Open research workspace →
      </Link>
    </section>
  );
}
