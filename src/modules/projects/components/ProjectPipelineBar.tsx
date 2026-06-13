import { PIPELINE_STAGES, type PipelineStage } from '../../../types/project.types';
import './projects-pipeline.css';

interface Props {
  currentStage: PipelineStage;
  compact?: boolean;
}

export function ProjectPipelineBar({ currentStage, compact = false }: Props) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage);

  return (
    <div className={`pipeline-bar${compact ? ' pipeline-bar--compact' : ''}`}>
      <div className="pipeline-bar__track">
        {PIPELINE_STAGES.map((stage, index) => {
          let className = 'pipeline-bar__segment';
          if (index < currentIndex) className += ' pipeline-bar__segment--completed';
          else if (index === currentIndex) className += ' pipeline-bar__segment--active';
          return <div key={stage} className={className} title={stage} />;
        })}
      </div>
      {!compact && (
        <div className="pipeline-bar__labels">
          {PIPELINE_STAGES.map((stage, index) => {
            let className = 'pipeline-bar__label';
            if (index < currentIndex) className += ' pipeline-bar__label--completed';
            else if (index === currentIndex) className += ' pipeline-bar__label--active';
            return (
              <span key={stage} className={className}>
                {stage}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
