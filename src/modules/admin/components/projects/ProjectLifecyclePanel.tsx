import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkflow } from '../../../workflow/hooks/useWorkflow';
import { fetchAdminProjectCounts } from '../../services/adminProjects.service';
import { AdminLoadingState } from '../layout/AdminLoadingState';

interface ProjectLifecyclePanelProps {
  projectId: string;
  projectName: string;
}

export function ProjectLifecyclePanel({ projectId, projectName }: ProjectLifecyclePanelProps) {
  const { lifecycle, readiness, stages, loading, error } = useWorkflow(projectId);
  const [counts, setCounts] = useState({ experiments: 0, prototypes: 0, fundingPitches: 0 });

  useEffect(() => {
    fetchAdminProjectCounts(projectId).then(setCounts);
  }, [projectId]);

  if (loading) {
    return <AdminLoadingState label="Loading lifecycle…" compact />;
  }

  if (error) {
    return <div className="admin-alert admin-alert--danger">{error}</div>;
  }

  const currentStage = stages.find((s) => s.id === lifecycle?.currentStageId);

  return (
    <div className="admin-section-card admin-lifecycle-panel">
      <div className="admin-card-header">
        <h3>🔄 Innovation lifecycle</h3>
        <span className="admin-badge admin-badge--purple">{projectName}</span>
      </div>

      <div className="admin-lifecycle-grid">
        <div>
          <div className="admin-quick-stat-label">Current stage</div>
          <div className="admin-quick-stat-value">{currentStage?.label ?? lifecycle?.currentStageId ?? '—'}</div>
        </div>
        <div>
          <div className="admin-quick-stat-label">Workflow status</div>
          <div className="admin-quick-stat-value">{lifecycle?.workflowStatus ?? '—'}</div>
        </div>
        <div>
          <div className="admin-quick-stat-label">Readiness</div>
          <div className="admin-quick-stat-value">{readiness?.overallScore ?? lifecycle?.overallReadinessScore ?? 0}%</div>
        </div>
        <div>
          <div className="admin-quick-stat-label">Blocked</div>
          <div className={`admin-quick-stat-value ${lifecycle?.blocked ? 'admin-text-danger' : ''}`}>
            {lifecycle?.blocked ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {lifecycle?.blocked && lifecycle.blockedReason ? (
        <p className="admin-lifecycle-blocker">Blocker: {lifecycle.blockedReason}</p>
      ) : null}

      {lifecycle?.nextRecommendedAction ? (
        <p className="admin-lifecycle-next">Next: {lifecycle.nextRecommendedAction}</p>
      ) : null}

      <div className="admin-lifecycle-readiness">
        {readiness ? (
          <>
            <ReadinessBar label="Research" value={readiness.researchScore} />
            <ReadinessBar label="Prototype" value={readiness.prototypeScore} />
            <ReadinessBar label="Experiment" value={readiness.experimentScore} />
            <ReadinessBar label="Validation" value={readiness.validationScore} />
            <ReadinessBar label="Funding" value={readiness.fundingScore} />
            <ReadinessBar label="Commercialization" value={readiness.commercializationScore} />
          </>
        ) : null}
      </div>

      <div className="admin-lifecycle-links">
        <Link to={`/admin/projects/${projectId}/research/edit`} className="admin-card-link">
          Edit research profile
        </Link>
        <Link to={`/admin/projects/${projectId}/commercialization/edit`} className="admin-card-link">
          Edit commercialization
        </Link>
        <Link to={`/experiments?project=${projectId}`} className="admin-card-link">
          Experiments ({counts.experiments})
        </Link>
        <Link to={`/prototypes?project=${projectId}`} className="admin-card-link">
          Prototypes ({counts.prototypes})
        </Link>
        <Link to={`/funding?project=${projectId}`} className="admin-card-link">
          Funding pitches ({counts.fundingPitches})
        </Link>
      </div>
    </div>
  );
}

function ReadinessBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-status-item">
      <div className="admin-status-label">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="admin-progress-bar">
        <div className="admin-progress active" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
