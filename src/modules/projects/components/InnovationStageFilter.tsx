import {
  INNOVATION_STAGES,
  type InnovationFilterStage,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';

interface Props {
  activeStage: InnovationFilterStage;
  onStageChange: (stage: InnovationFilterStage) => void;
  stageCounts: Record<InnovationStage, number>;
  totalCount: number;
}

const OPTIONS: InnovationFilterStage[] = ['All', ...INNOVATION_STAGES];

export function InnovationStageFilter({
  activeStage,
  onStageChange,
  stageCounts,
  totalCount,
}: Props) {
  return (
    <div className="icc-stage-filter">
      {OPTIONS.map((stage) => {
        const count = stage === 'All' ? totalCount : stageCounts[stage];
        return (
          <button
            key={stage}
            type="button"
            className={`icc-stage-btn${activeStage === stage ? ' icc-stage-btn--active' : ''}`}
            onClick={() => onStageChange(stage)}
          >
            {stage}
            <span className="icc-stage-badge">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
