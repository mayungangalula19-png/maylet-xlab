import { Link } from 'react-router-dom';
import { getStageActionRoute } from '../../../lib/innovation/navigation';
import { generateMayaProjectRecommendation } from '../../../lib/innovation/recommendations';
import type { Project } from '../../../types/project.types';
import { getInnovationMetrics } from '../../../lib/innovation/lifecycle';

interface Props {
  project: Project | null;
  onCreateProject?: () => void;
}

export function MayaInnovationAdvisor({ project, onCreateProject }: Props) {
  if (!project) {
    return (
      <div className="icc-glass icc-widget icc-maya-advisor">
        <div className="icc-widget-header">
          <h3>MAYA Innovation Advisor</h3>
          <Link to="/ai-assistant" className="icc-widget-link">Ask MAYA</Link>
        </div>
        <p className="icc-widget-empty-text">
          Create a project to receive stage-specific recommendations on research, experiments, funding, and commercialization.
        </p>
        <div className="icc-onboarding-steps">
          <Link to="/projects?create=1" className="icc-onboarding-step icc-clickable">1. Create your first innovation</Link>
          <Link to="/documents" className="icc-onboarding-step icc-clickable">2. Upload research documentation</Link>
          <Link to="/ai-assistant" className="icc-onboarding-step icc-clickable">3. Ask MAYA for guidance</Link>
        </div>
        {onCreateProject ? (
          <button type="button" className="icc-widget-cta" onClick={onCreateProject}>
            Create project →
          </button>
        ) : null}
      </div>
    );
  }

  const metrics = getInnovationMetrics(project);
  const recommendation = generateMayaProjectRecommendation(project);
  const actionRoute = getStageActionRoute(metrics.stage, project.id);

  return (
    <div className="icc-glass icc-widget icc-maya-advisor">
      <div className="icc-widget-header">
        <h3>MAYA Innovation Advisor</h3>
        <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="icc-widget-link">Full Analysis</Link>
      </div>

      <p className="icc-maya-summary">{recommendation.summary}</p>

      <Link to={actionRoute} className="icc-next-action icc-clickable" title="Take recommended action">
        <strong>Recommended:</strong> {recommendation.nextStep}
      </Link>

      <div className="icc-maya-scores">
        <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="icc-maya-score-item icc-clickable">
          Innovation Score
          <strong style={{ color: '#7c5fe6' }}>{metrics.innovationScore}</strong>
        </Link>
        <Link to="/funding" className="icc-maya-score-item icc-clickable">
          Funding Readiness
          <strong style={{ color: '#48bb78' }}>{metrics.fundingReadiness}%</strong>
        </Link>
        <Link to={`/projects/${project.id}`} className="icc-maya-score-item icc-clickable">
          Commercialization
          <strong style={{ color: '#f6c90e' }}>{metrics.commercializationReadiness}%</strong>
        </Link>
        <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="icc-maya-score-item icc-clickable">
          Risk Level
          <strong className={`icc-risk-${metrics.riskLevel}`}>{metrics.riskLevel}</strong>
        </Link>
      </div>

      <div className="icc-maya-factors">
        <strong>Analysis factors</strong>
        <ul>
          {recommendation.factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      {metrics.missingRequirements.length > 0 && (
        <div className="icc-maya-missing">
          <strong>Missing requirements</strong>
          <ul>
            {metrics.missingRequirements.map((r) => (
              <li key={r}>
                <Link to={actionRoute}>{r}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="btn-analyze icc-clickable">
        Run MAYA Analysis
      </Link>
    </div>
  );
}
