import type { PrototypeAiEvaluation } from '../types/prototype.types';

interface Props {
  evaluation: PrototypeAiEvaluation | null;
  readinessScore?: number;
  nextAction?: string;
}

export function AIEvaluationPanel({ evaluation, readinessScore, nextAction }: Props) {
  if (!evaluation) {
    return (
      <section className="proto-ai-panel proto-ai-panel--empty">
        <h3>MAYA AI Evaluation</h3>
        <p>Upload builds and run tests to unlock risk and readiness scores.</p>
      </section>
    );
  }

  return (
    <section className="proto-ai-panel">
      <header className="proto-ai-panel__header">
        <h3>MAYA AI Evaluation</h3>
        <span className={`proto-ai-rec proto-ai-rec--${evaluation.recommendation.toLowerCase()}`}>
          {evaluation.recommendation}
        </span>
      </header>
      <div className="proto-ai-scores">
        <div className="proto-ai-score">
          <strong>{evaluation.riskScore}</strong>
          <span>Risk score</span>
        </div>
        <div className="proto-ai-score">
          <strong>{readinessScore ?? Math.max(0, 100 - evaluation.riskScore)}</strong>
          <span>Readiness</span>
        </div>
      </div>
      <p className="proto-ai-explanation">{evaluation.explanation}</p>
      {evaluation.improvements.length > 0 && (
        <div>
          <h4>Suggested improvements</h4>
          <ul>{evaluation.improvements.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      )}
      {evaluation.failurePoints.length > 0 && (
        <div>
          <h4>Issues found</h4>
          <ul>{evaluation.failurePoints.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      )}
      {nextAction && (
        <p className="proto-ai-next">
          <strong>Recommended next action:</strong> {nextAction}
        </p>
      )}
    </section>
  );
}
