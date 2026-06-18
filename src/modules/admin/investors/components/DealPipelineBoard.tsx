import { memo, useCallback, useState } from 'react';
import { DEAL_STAGES, type Deal, type DealStage } from '../types/investorOps.types';
import { formatAdminCurrency } from '../../utils/adminPage.utils';

interface DealPipelineBoardProps {
  byStage: Record<DealStage, Deal[]>;
  actionLoading: string | null;
  onMoveDeal: (dealId: string, stage: DealStage) => Promise<void>;
  onSelectDeal?: (deal: Deal) => void;
}

const DealCard = memo(function DealCard({
  deal,
  busy,
  onDragStart,
  onSelect,
}: {
  deal: Deal;
  busy: boolean;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onSelect?: (deal: Deal) => void;
}) {
  return (
    <div
      className={`admin-deal-card ${busy ? 'admin-deal-card--busy' : ''}`}
      draggable={!busy}
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onSelect?.(deal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(deal)}
    >
      <div className="admin-deal-card-title">{deal.title}</div>
      <div className="admin-deal-card-meta">{deal.investorName}</div>
      <div className="admin-deal-card-footer">
        <span>{formatAdminCurrency(deal.amount)}</span>
        <span className="admin-deal-card-prob">{deal.probabilityScore}%</span>
      </div>
    </div>
  );
});

export const DealPipelineBoard = memo(function DealPipelineBoard({
  byStage,
  actionLoading,
  onMoveDeal,
  onSelectDeal,
}: DealPipelineBoardProps) {
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DealStage | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/deal-id', dealId);
    e.dataTransfer.effectAllowed = 'move';
    setDragDealId(dealId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, stage: DealStage) => {
      e.preventDefault();
      const dealId = e.dataTransfer.getData('text/deal-id');
      setDropTarget(null);
      setDragDealId(null);
      if (!dealId) return;
      const current = Object.values(byStage).flat().find((d) => d.id === dealId);
      if (current?.stage === stage) return;
      await onMoveDeal(dealId, stage);
    },
    [byStage, onMoveDeal]
  );

  return (
    <div className="admin-deal-pipeline">
      {DEAL_STAGES.map((col) => {
        const deals = byStage[col.id];
        const isDrop = dropTarget === col.id;
        return (
          <div
            key={col.id}
            className={`admin-deal-column ${isDrop ? 'admin-deal-column--drop' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => void handleDrop(e, col.id)}
          >
            <div className="admin-deal-column-header" style={{ borderColor: col.color }}>
              <span>{col.label}</span>
              <span className="admin-deal-column-count">{deals.length}</span>
            </div>
            <div className="admin-deal-column-body">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  busy={actionLoading === deal.id || dragDealId === deal.id}
                  onDragStart={handleDragStart}
                  onSelect={onSelectDeal}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
