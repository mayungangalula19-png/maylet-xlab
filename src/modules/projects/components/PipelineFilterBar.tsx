import {
  PIPELINE_STAGES,
  type PipelineFilterStage,
  type PipelineStage,
} from '../../../types/project.types';
import './projects-pipeline.css';

interface Props {
  activeStage: PipelineFilterStage;
  onStageChange: (stage: PipelineFilterStage) => void;
  stageCounts: Record<PipelineStage, number>;
  totalCount: number;
}

const FILTER_OPTIONS: PipelineFilterStage[] = ['All', ...PIPELINE_STAGES];

export function PipelineFilterBar({
  activeStage,
  onStageChange,
  stageCounts,
  totalCount,
}: Props) {
  return (
    <div className="pipeline-filter-bar">
      {FILTER_OPTIONS.map((stage) => {
        const count = stage === 'All' ? totalCount : stageCounts[stage];
        return (
          <button
            key={stage}
            type="button"
            className={`pipeline-filter-btn${activeStage === stage ? ' pipeline-filter-btn--active' : ''}`}
            onClick={() => onStageChange(stage)}
          >
            {stage}
            <span className="pipeline-filter-badge">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
