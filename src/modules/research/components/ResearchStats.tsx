import type { ResearchDashboardStats } from '../types/research.types';

const LABELS: { key: keyof ResearchDashboardStats; label: string; suffix?: string }[] = [
  { key: 'researchProjects', label: 'Research Projects' },
  { key: 'notes', label: 'Research Notes' },
  { key: 'literatureReviews', label: 'Literature Reviews' },
  { key: 'papers', label: 'Research Papers' },
  { key: 'documents', label: 'Uploaded Documents' },
  { key: 'knowledgeAssets', label: 'Knowledge Assets' },
  { key: 'completionRate', label: 'Completion Rate', suffix: '%' },
];

interface Props {
  stats: ResearchDashboardStats;
}

export function ResearchStats({ stats }: Props) {
  return (
    <div className="research-stats">
      {LABELS.map(({ key, label, suffix }) => (
        <div
          key={key}
          className={`research-glass research-stat${key === 'completionRate' ? ' research-stat--wide' : ''}`}
        >
          <strong>
            {suffix ? `${stats[key]}${suffix}` : stats[key]}
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
