import type { MayaContext } from '../../lib/maya/types';
import { MayaQuickTools } from './MayaQuickTools';

interface Props {
  context: MayaContext | null;
  projects: { id: string; name: string }[];
  selectedProjectId?: string;
  onProjectChange?: (id: string) => void;
}

export function MayaContextPanel({
  context,
  projects,
  selectedProjectId,
  onProjectChange,
}: Props) {
  return (
    <aside className="maya-context-panel">
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6 }}>
        Active context
      </h3>

      <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Project</label>
      <select
        value={selectedProjectId ?? ''}
        onChange={(e) => onProjectChange?.(e.target.value)}
        style={{
          width: '100%',
          marginBottom: '1rem',
          padding: '0.5rem',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.3)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <option value="">— None —</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {context?.projectName && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 600 }}>{context.projectName}</div>
          {context.projectStage && (
            <div style={{ fontSize: '0.85rem', opacity: 0.75 }}>Stage: {context.projectStage}</div>
          )}
          {context.projectProgress != null && (
            <div style={{ fontSize: '0.85rem', opacity: 0.75 }}>
              Progress: {context.projectProgress}%
            </div>
          )}
        </div>
      )}

      {context?.scores && (
        <div className="maya-score-ring">
          <div className="maya-score-item">
            <strong>{context.scores.innovation_score}%</strong>
            <span style={{ fontSize: '0.7rem' }}>Innovation</span>
          </div>
          <div className="maya-score-item">
            <strong>{context.scores.market_potential}%</strong>
            <span style={{ fontSize: '0.7rem' }}>Market</span>
          </div>
          <div className="maya-score-item">
            <strong>{context.scores.technical_feasibility}%</strong>
            <span style={{ fontSize: '0.7rem' }}>Technical</span>
          </div>
          <div className="maya-score-item">
            <strong>{context.scores.funding_readiness}%</strong>
            <span style={{ fontSize: '0.7rem' }}>Funding</span>
          </div>
        </div>
      )}

      <MayaQuickTools />
    </aside>
  );
}
