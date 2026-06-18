import { memo, useCallback, useState } from 'react';
import { InnovatorCard } from './InnovatorCard';
import { INNOVATOR_STAGES, type Innovator, type InnovatorStage } from '../types/innovatorOps.types';

interface InnovatorKanbanProps {
  byStage: Record<InnovatorStage, Innovator[]>;
  selectedId: string | null;
  actionLoading: string | null;
  onMoveStage: (id: string, stage: InnovatorStage) => Promise<void>;
  onSelect: (id: string) => void;
}

export const InnovatorKanban = memo(function InnovatorKanban({
  byStage,
  selectedId,
  actionLoading,
  onMoveStage,
  onSelect,
}: InnovatorKanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<InnovatorStage | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/innovator-id', id);
    e.dataTransfer.effectAllowed = 'move';
    setDragId(id);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, stage: InnovatorStage) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/innovator-id');
      setDropStage(null);
      setDragId(null);
      if (!id) return;
      const current = Object.values(byStage).flat().find((i) => i.id === id);
      if (current?.stage === stage) return;

      setMoveError(null);
      try {
        await onMoveStage(id, stage);
      } catch (err) {
        setMoveError(err instanceof Error ? err.message : 'Failed to move innovator');
      }
    },
    [byStage, onMoveStage]
  );

  return (
    <div className="admin-innovator-kanban-wrap">
      {moveError ? (
        <div className="admin-alert admin-alert--danger admin-innovator-kanban-error">{moveError}</div>
      ) : null}
      <div className="admin-innovator-kanban">
        {INNOVATOR_STAGES.map((col) => (
          <div
            key={col.id}
            className={`admin-innovator-column ${dropStage === col.id ? 'admin-innovator-column--drop' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropStage(col.id);
            }}
            onDragLeave={() => setDropStage(null)}
            onDrop={(e) => void handleDrop(e, col.id)}
          >
            <div className="admin-innovator-column-header" style={{ borderColor: col.color }}>
              <span>{col.label}</span>
              <span className="admin-innovator-column-count">{byStage[col.id].length}</span>
            </div>
            <div className="admin-innovator-column-body">
              {byStage[col.id].length === 0 ? (
                <p className="admin-muted admin-innovator-column-empty">Drop here</p>
              ) : (
                byStage[col.id].map((inv) => (
                  <InnovatorCard
                    key={inv.id}
                    innovator={inv}
                    selected={selectedId === inv.id}
                    busy={actionLoading === inv.id || dragId === inv.id}
                    onSelect={onSelect}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
