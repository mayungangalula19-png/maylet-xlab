import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateProjectRecommendations } from '../../ai/researchImpactEngine';
import { researchService } from '../../research';
import { gateService } from '../../research/services/gateService';
import { GateStatusBadge } from './GateStatusBadge';
import { EMPTY } from '../../../lib/innovation/dashboardData';
import type { Project } from '../../../types/project.types';
import type { ProjectRecommendation } from '../../research/types/research.types';
import type { GateDecision } from '../../research/types/gate.types';
import { canAuthorizePrototype } from '../../research/ai/gateEngine';

interface Props {
  project: Project | null;
  userId: string;
}

export function ResearchImpactAlerts({ project, userId }: Props) {
  const [rec, setRec] = useState<ProjectRecommendation | null>(null);
  const [gateDecision, setGateDecision] = useState<GateDecision | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project || !userId) {
      setRec(null);
      setGateDecision(null);
      return;
    }
    setLoading(true);
    Promise.all([
      researchService.getSnapshot(project.id, userId),
      gateService.getLatest(project.id),
    ])
      .then(([snapshot, gate]) => {
        setGateDecision(gate?.decision ?? null);
        setRec(
          generateProjectRecommendations(
            {
              id: project.id,
              name: project.name,
              sector: project.sector,
              status: project.status,
              progress: project.progress,
            },
            snapshot
          )
        );
      })
      .catch(() => {
        setRec(null);
        setGateDecision(null);
      })
      .finally(() => setLoading(false));
  }, [project, userId]);

  if (!project) return null;

  const prototypeAuthorized = gateDecision ? canAuthorizePrototype(gateDecision) : false;

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Research Impact</h3>
        <Link to={`/research/${project.id}?tab=gate`} className="icc-widget-link">Gate</Link>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <GateStatusBadge decision={gateDecision ?? 'pending'} />
      </div>

      {prototypeAuthorized ? (
        <p className="icc-widget-empty-text" style={{ color: '#48bb78' }}>
          Prototype authorized — gate approved
        </p>
      ) : gateDecision === 'hold' || gateDecision === 'no_go' ? (
        <p className="icc-widget-empty-text">Prototype blocked — complete gate review</p>
      ) : null}

      {loading ? (
        <p className="icc-widget-empty-text">Analyzing research…</p>
      ) : !rec ? (
        <p className="icc-widget-empty-text">{EMPTY.COMPLETE_SETUP}</p>
      ) : (
        <>
          {rec.riskScore != null && (
            <div className="icc-status-row">
              <span>Risk score</span>
              <strong>{rec.riskScore}</strong>
            </div>
          )}
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0' }}>
            {rec.explanation}
          </p>

          {rec.nextSteps.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem' }}>Auto recommendations</div>
              {rec.nextSteps.slice(0, 2).map((s) => (
                <div key={s} className="icc-doc-item" style={{ fontSize: '0.72rem' }}>{s}</div>
              ))}
            </div>
          )}

          {rec.taskSuggestions.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem' }}>AI suggested changes</div>
              {rec.taskSuggestions.slice(0, 2).map((t) => (
                <div key={t} className="icc-doc-item" style={{ fontSize: '0.72rem' }}>{t}</div>
              ))}
            </div>
          )}

          <Link to={`/research/${project.id}`} className="icc-widget-cta" style={{ marginTop: '0.5rem', display: 'block' }}>
            Open research workspace →
          </Link>
        </>
      )}
    </div>
  );
}
