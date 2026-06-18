import { memo } from 'react';
import type { Innovator } from '../types/innovatorOps.types';
import { priorityColor, stageLabel } from '../types/innovatorOps.types';

interface InnovatorDirectoryPanelProps {
  innovators: Innovator[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#48bb78';
  if (score >= 50) return '#f6c90e';
  return '#fc8181';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export const InnovatorDirectoryPanel = memo(function InnovatorDirectoryPanel({
  innovators,
  selectedId,
  onSelect,
}: InnovatorDirectoryPanelProps) {
  return (
    <section className="admin-innovator-ops-left">
      <div className="admin-innovator-ops-panel-head">
        <h3>Innovator Directory</h3>
        <span className="admin-muted">{innovators.length}</span>
      </div>
      <div className="admin-innovator-directory-list">
        {innovators.length === 0 ? (
          <p className="admin-muted admin-innovator-empty-hint">
            No innovator profiles yet. Users with role <code>innovator</code> appear here automatically.
          </p>
        ) : (
          innovators.map((inv) => (
            <button
              key={inv.id}
              type="button"
              className={`admin-innovator-directory-item ${selectedId === inv.id ? 'admin-innovator-directory-item--selected' : ''}`}
              onClick={() => onSelect(inv.id)}
            >
              <span className="admin-innovator-avatar">{initials(inv.fullName)}</span>
              <span className="admin-innovator-directory-body">
                <span className="admin-innovator-directory-name">{inv.fullName}</span>
                <span className="admin-muted admin-innovator-directory-idea">{inv.ideaTitle}</span>
                <span className="admin-innovator-directory-meta">
                  <span>{stageLabel(inv.stage)}</span>
                  <span style={{ color: priorityColor(inv.priority) }}>{inv.priority}</span>
                </span>
              </span>
              <span className="admin-innovator-directory-score" style={{ color: scoreColor(inv.finalScore) }}>
                {inv.finalScore}
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
});
