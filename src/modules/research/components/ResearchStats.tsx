import { useMemo } from 'react';
import type { ResearchDashboardStats } from '../types/research.types';

type StatKey = Exclude<keyof ResearchDashboardStats, 'completionRate'>;

const STAT_ITEMS: {
  key: StatKey;
  label: string;
  icon: string;
  hint: string;
}[] = [
  { key: 'researchProjects', label: 'Projects', icon: '🔬', hint: 'Active research workspaces' },
  { key: 'notes', label: 'Notes', icon: '📓', hint: 'Interview, fieldwork, and meeting notes' },
  { key: 'literatureReviews', label: 'Literature', icon: '📚', hint: 'Reviews and referenced sources' },
  { key: 'papers', label: 'Papers', icon: '📄', hint: 'Papers and journal articles' },
  { key: 'documents', label: 'Documents', icon: '📎', hint: 'Uploaded evidence files' },
  { key: 'knowledgeAssets', label: 'Knowledge assets', icon: '🧠', hint: 'Notes + literature + documents' },
];

interface Props {
  stats: ResearchDashboardStats;
  compact?: boolean;
}

function formatValue(value: number): string {
  return value.toLocaleString();
}

function completionTier(rate: number): 'ready' | 'strong' | 'progress' | 'start' {
  if (rate >= 100) return 'ready';
  if (rate >= 60) return 'strong';
  if (rate > 0) return 'progress';
  return 'start';
}

function tierLabel(tier: ReturnType<typeof completionTier>): string {
  switch (tier) {
    case 'ready':
      return 'Portfolio gate-ready average';
    case 'strong':
      return 'Strong portfolio progress';
    case 'progress':
      return 'Research in progress';
    default:
      return 'Getting started';
  }
}

export function ResearchStats({ stats, compact }: Props) {
  const tier = completionTier(stats.completionRate);
  const hasActivity = stats.knowledgeAssets > 0 || stats.researchProjects > 0;

  const summaryParts = useMemo(
    () =>
      [
        `${stats.researchProjects} project${stats.researchProjects === 1 ? '' : 's'}`,
        `${formatValue(stats.knowledgeAssets)} knowledge assets`,
        stats.completionRate > 0 ? `${stats.completionRate}% avg completion` : null,
      ].filter(Boolean),
    [stats]
  );

  return (
    <section className={`research-stats-panel${compact ? ' research-stats-panel--compact' : ''}`} aria-label="Research portfolio metrics">
      <header className="research-stats-panel__header">
        <div>
          <h2>{compact ? 'Portfolio metrics' : 'Research portfolio'}</h2>
          <p className="research-stats-panel__summary">{summaryParts.join(' · ')}</p>
        </div>
        {!hasActivity ? (
          <span className="research-stats-panel__badge research-stats-panel__badge--empty">No activity yet</span>
        ) : stats.completionRate >= 100 ? (
          <span className="research-stats-panel__badge research-stats-panel__badge--ready">Gate-ready avg</span>
        ) : null}
      </header>

      <div className={`research-stat research-stat--featured research-stat--${tier}`}>
        <div className="research-stat--featured__head">
          <span className="research-stat__icon" aria-hidden>
            📊
          </span>
          <div>
            <span className="research-stat__label">Avg completion rate</span>
            <span className={`research-stat__tier research-stat__tier--${tier}`}>{tierLabel(tier)}</span>
          </div>
          <strong className="research-stat--featured__value">{stats.completionRate}%</strong>
        </div>
        <div
          className="research-progress-bar research-stat--featured__bar"
          role="progressbar"
          aria-valuenow={stats.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${Math.min(100, Math.max(0, stats.completionRate))}%` }} />
        </div>
        <p className="research-stat--featured__hint">
          Average system evidence completion across all research projects
        </p>
      </div>

      <div className="research-stats">
        {STAT_ITEMS.map(({ key, label, icon, hint }) => {
          const value = stats[key];
          const highlight = key === 'knowledgeAssets' && value > 0;

          return (
            <div
              key={key}
              className={`research-glass research-stat research-stat--card${highlight ? ' research-stat--highlight' : ''}`}
              title={hint}
            >
              <span className="research-stat__icon" aria-hidden>
                {icon}
              </span>
              <strong>{formatValue(value)}</strong>
              <span className="research-stat__label">{label}</span>
              {!compact ? <span className="research-stat__hint">{hint}</span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
