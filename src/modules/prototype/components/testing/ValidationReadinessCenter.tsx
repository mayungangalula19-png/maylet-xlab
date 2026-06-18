import type { CSSProperties } from 'react';
import type { ReadinessScores } from '../../utils/testingCenter.utils';

interface Props {
  readiness: ReadinessScores;
}

export function ValidationReadinessCenter({ readiness }: Props) {
  const gauges = [
    { label: 'Testing completion', value: readiness.completionPct },
    { label: 'Quality score', value: readiness.qualityScore },
    { label: 'Risk score', value: 100 - readiness.riskScore, invert: true },
    { label: 'Readiness index', value: readiness.readinessIndex, primary: true },
  ];

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Validation readiness</h2>
        <p>Outcomes feed directly into the Validation Center</p>
      </header>
      <div className="proto-test-readiness-gauges">
        {gauges.map((g) => (
          <div key={g.label} className={`proto-test-gauge${g.primary ? ' proto-test-gauge--primary' : ''}`}>
            <div className="proto-test-gauge__ring" style={{ '--pct': `${g.value}%` } as CSSProperties}>
              <strong>{g.value}%</strong>
            </div>
            <span>{g.label}</span>
          </div>
        ))}
      </div>
      <p className="proto-test-readiness-verdict">
        {readiness.readinessIndex >= 75
          ? 'Ready for formal validation workflow.'
          : readiness.readinessIndex >= 50
            ? 'Continue testing — address critical issues before validation.'
            : 'Not ready — expand test coverage and resolve defects.'}
      </p>
    </section>
  );
}
