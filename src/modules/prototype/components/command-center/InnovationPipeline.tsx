import type { DragEvent } from 'react';
import type { InnovationStage, PipelineStageMetrics } from '../../types/commandCenter.types';
import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  pipeline: PipelineStageMetrics[];
  portfolio: PortfolioItem[];
  onMove: (item: PortfolioItem, stage: InnovationStage) => void;
}

export function InnovationPipeline({ pipeline, portfolio, onMove }: Props) {
  const handleDrop = (e: DragEvent, stage: InnovationStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const item = portfolio.find((p) => p.prototype.id === id);
    if (item) onMove(item, stage);
  };

  return (
    <section className="proto-cc-pipeline" aria-label="Innovation pipeline">
      <header className="proto-cc-section-head">
        <h2>Innovation pipeline</h2>
        <p>Lifecycle board · drag prototypes between stages</p>
      </header>
      <div className="proto-cc-pipeline__board">
        {pipeline.map((col) => (
          <div
            key={col.id}
            className={`proto-cc-pipeline__col${col.bottleneck ? ' proto-cc-pipeline__col--bottleneck' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="proto-cc-pipeline__col-head">
              <h3>{col.label}</h3>
              <span className="proto-cc-pipeline__count">{col.count}</span>
            </div>
            <div className="proto-cc-pipeline__metrics">
              <span>{col.successRate}% success</span>
              <span>~{col.avgDaysInStage}d avg</span>
              {col.riskCount > 0 ? <span className="proto-cc-pipeline__risk">{col.riskCount} at risk</span> : null}
            </div>
            <ul className="proto-cc-pipeline__cards">
              {portfolio
                .filter((p) => p.stage === col.id)
                .slice(0, 4)
                .map((p) => (
                  <li
                    key={p.prototype.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', p.prototype.id)}
                    className="proto-cc-pipeline__card"
                  >
                    {p.prototype.name}
                  </li>
                ))}
              {col.count > 4 ? <li className="proto-cc-pipeline__more">+{col.count - 4} more</li> : null}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
