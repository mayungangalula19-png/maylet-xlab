import { Link } from 'react-router-dom';
import type { Project } from '../../../types/project.types';
import { getInnovationMetrics } from '../../../lib/innovation/lifecycle';
import type { ProjectPriority, RecommendedAction } from '../../../lib/innovation/recommendations';
import { MayaInnovationAdvisor } from './MayaInnovationAdvisor';
import { NextRecommendedActions } from './NextRecommendedActions';

interface Props {
  project: Project | null;
  onCreateProject: () => void;
  recommendedActions: RecommendedAction[];
  priorities: {
    highPriority: ProjectPriority[];
    atRisk: ProjectPriority[];
    readyForFunding: ProjectPriority[];
    readyForValidation: ProjectPriority[];
    readyForCommercialization: ProjectPriority[];
  };
}

function ProjectQueue({
  title,
  items,
  scoreLabel,
}: {
  title: string;
  items: ProjectPriority[];
  scoreLabel: string;
}) {
  return (
    <div className="icc-maya-queue">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="icc-queue-empty">None at this time</p>
      ) : (
        <ul className="icc-queue-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={item.route} className="icc-queue-item icc-clickable">
                <span className="icc-queue-name">{item.name}</span>
                <span className="icc-queue-meta">
                  {item.stage} · {scoreLabel} {item.score}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MayaCommandCenter({ project, onCreateProject, recommendedActions, priorities }: Props) {
  const metrics = project ? getInnovationMetrics(project) : null;
  const needingAttention = [...priorities.atRisk, ...priorities.highPriority].slice(0, 4);

  return (
    <div className="icc-maya-command-center">
      <div className="icc-maya-grid">
        <MayaInnovationAdvisor project={project} onCreateProject={onCreateProject} />

        <div className="icc-glass icc-widget icc-maya-intel">
          <div className="icc-widget-header">
            <h3>MAYA Intelligence</h3>
            <Link to="/ai-assistant" className="icc-widget-link">Full Analysis</Link>
          </div>
          {metrics ? (
            <div className="icc-maya-scores-grid">
              <Link to={`/ai-assistant/analyze?projectId=${project!.id}`} className="icc-maya-score-card icc-clickable">
                <span>Innovation Score</span>
                <strong>{metrics.innovationScore}</strong>
              </Link>
              <Link to="/funding" className="icc-maya-score-card icc-clickable">
                <span>Funding Readiness</span>
                <strong>{metrics.fundingReadiness}</strong>
              </Link>
              <Link to="/marketplace" className="icc-maya-score-card icc-clickable">
                <span>Commercialization</span>
                <strong>{metrics.commercializationReadiness}</strong>
              </Link>
              <Link to={`/ai-assistant/analyze?projectId=${project!.id}`} className="icc-maya-score-card icc-clickable">
                <span>Risk Level</span>
                <strong className={`icc-risk-${metrics.riskLevel}`}>{metrics.riskLevel}</strong>
              </Link>
            </div>
          ) : (
            <p className="icc-queue-empty">Create a project for MAYA intelligence scores</p>
          )}

          {metrics && metrics.missingRequirements.length > 0 && (
            <div className="icc-maya-missing">
              <strong>Missing Requirements</strong>
              <ul>
                {metrics.missingRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {metrics && (
            <div className="icc-maya-opportunity">
              <strong>Opportunity Analysis</strong>
              <p>
                {metrics.stage === 'Funding' || metrics.fundingReadiness >= 70
                  ? 'Strong funding window — prioritize investor outreach and grant applications.'
                  : metrics.stage === 'Validation'
                    ? 'Validation momentum detected — capture user evidence before scaling.'
                    : 'Accelerate research and experimentation to unlock funding pathways.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <NextRecommendedActions actions={recommendedActions} />

      <div className="icc-maya-queues-grid">
        <ProjectQueue title="Projects Needing Attention" items={needingAttention} scoreLabel="Score" />
        <ProjectQueue title="Ready for Funding" items={priorities.readyForFunding} scoreLabel="Readiness" />
        <ProjectQueue title="Ready for Validation" items={priorities.readyForValidation} scoreLabel="Progress" />
        <ProjectQueue title="Ready for Commercialization" items={priorities.readyForCommercialization} scoreLabel="Score" />
      </div>
    </div>
  );
}
