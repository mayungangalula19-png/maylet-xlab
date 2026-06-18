import { Link } from 'react-router-dom';
import { normalizeValidationEvidence } from '../services/validationService';
import type { ValidationEvidenceSummary } from '../types/validation.types';

interface Props {
  evidence: ValidationEvidenceSummary;
}

export function ValidationEvidencePanel({ evidence }: Props) {
  const { research, prototypes, experiments, projectId } = normalizeValidationEvidence(
    evidence,
    evidence.projectId,
    evidence.projectName
  );

  return (
    <section className="val-panel">
      <h2>Evidence</h2>
      <p className="val-panel__sub">Read-only summary from Research, Prototype, and Experiment modules.</p>

      <div className="val-evidence-grid">
        <div className="val-evidence-block">
          <h3>Research</h3>
          <ul>
            <li>{research.findingsCount} findings</li>
            <li>{research.notesCount} notes ({research.interviewNotesCount} interviews)</li>
            <li>{research.literatureCount} literature sources</li>
            <li>{research.documentsCount} documents</li>
            <li>{research.completionPct}% completion</li>
          </ul>
          <Link to={`/research/${projectId}`}>View research →</Link>
        </div>

        <div className="val-evidence-block">
          <h3>Prototypes</h3>
          <ul>
            <li>{prototypes.count} prototypes</li>
            <li>{prototypes.successCount} successful builds</li>
            <li>{prototypes.withBuildCount} with artifacts</li>
            <li>{Math.round(prototypes.avgTestPassRate * 100)}% avg test pass rate</li>
          </ul>
          <Link to={`/prototypes?projectId=${projectId}`}>View prototypes →</Link>
        </div>

        <div className="val-evidence-block">
          <h3>Experiments</h3>
          <ul>
            <li>{experiments.count} experiments</li>
            <li>{experiments.completedCount} completed</li>
            <li>{experiments.withResultsCount} with results</li>
            <li>{experiments.marketTypeCount} market / {experiments.userTypeCount} user tests</li>
          </ul>
          <Link to={`/experiments?projectId=${projectId}`}>View experiments →</Link>
        </div>
      </div>
    </section>
  );
}
