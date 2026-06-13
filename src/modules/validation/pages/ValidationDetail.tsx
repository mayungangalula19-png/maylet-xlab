import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useValidationDetail } from '../hooks/useValidation';
import { ValidationScorePanel } from '../components/ValidationScorePanel';
import { ValidationEvidencePanel } from '../components/ValidationEvidencePanel';
import { ValidationDecisionPanel } from '../components/ValidationDecisionPanel';
import { FundingReadinessPanel } from '../components/FundingReadinessPanel';
import { MayaValidationInsights } from '../components/MayaValidationInsights';
import { evaluateValidation } from '../ai/validationAI.engine';
import type { ValidationMayaInsight } from '../types/validation.types';
import '../../projects/components/command-center.css';
import '../styles/validation.css';

export default function ValidationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { record, loading, error, promoting, setDecision, promote } = useValidationDetail(id, user?.id);
  const [insights, setInsights] = useState<ValidationMayaInsight[] | null>(null);
  const [mayaLoading, setMayaLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const displayInsights = insights ?? record?.maya_insights ?? [];

  const handleDecision = async (decision: Parameters<typeof setDecision>[0]) => {
    setDecisionError(null);
    try {
      await setDecision(decision);
    } catch (e) {
      setDecisionError(e instanceof Error ? e.message : 'Failed to update decision');
    }
  };

  const handleAskMaya = () => {
    if (!record) return;
    setMayaLoading(true);
    const result = evaluateValidation({
      evidence: record.evidence,
      projectProgress: record.scores.overall,
      projectStatus: record.decision,
    });
    setInsights(result.maya_insights);
    setMayaLoading(false);
  };

  if (loading) {
    return (
      <div className="icc-page val-page">
        <p>Loading validation…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="icc-page val-page">
        <p>Validation not found.</p>
        <Link to="/validation" className="val-btn val-btn--secondary">Back to hub</Link>
      </div>
    );
  }

  return (
    <div className="icc-page val-page">
      <header className="icc-page-header">
        <div>
          <h1>{record.project_name ?? 'Validation'}</h1>
          <p>Review scores, evidence, and funding readiness decision.</p>
        </div>
        <div className="icc-page-actions">
          <Link to={`/projects/${record.project_id}`} className="val-btn val-btn--ghost">Project</Link>
          <Link to="/validation" className="val-btn val-btn--secondary">Back</Link>
        </div>
      </header>

      {(error || decisionError) && <p className="val-error">{error ?? decisionError}</p>}

      <div className="val-detail-grid">
        <div>
          <ValidationScorePanel scores={record.scores} />
          <ValidationEvidencePanel evidence={record.evidence} />
        </div>
        <div>
          <ValidationDecisionPanel
            decision={record.decision}
            reviewerNotes={record.reviewer_notes}
            onDecisionChange={handleDecision}
            readOnly={Boolean(record.promoted_at)}
          />
          <FundingReadinessPanel record={record} onPromote={promote} promoting={promoting} />
          <MayaValidationInsights
            insights={displayInsights}
            onAskMaya={handleAskMaya}
            mayaLoading={mayaLoading}
          />
        </div>
      </div>
    </div>
  );
}
