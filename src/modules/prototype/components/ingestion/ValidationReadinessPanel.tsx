import type { CSSProperties } from 'react';
import type { IngestionReadiness } from '../../utils/ingestionCenter.utils';

interface Props {
  readiness: IngestionReadiness;
}

export function ValidationReadinessPanel({ readiness }: Props) {
  const gauges = [
    { label: 'Documentation', value: readiness.documentationScore },
    { label: 'Assets', value: readiness.assetScore },
    { label: 'Testing readiness', value: readiness.testingReadiness },
    { label: 'Validation score', value: readiness.validationScore, primary: true },
  ];

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head">
        <h2>Validation preparation</h2>
        <p>Readiness signals for the Validation Center</p>
      </header>
      <div className="proto-ingest-readiness">
        {gauges.map((g) => (
          <div key={g.label} className={`proto-ingest-gauge${g.primary ? ' proto-ingest-gauge--primary' : ''}`}>
            <div className="proto-ingest-gauge__ring" style={{ '--pct': `${g.value}%` } as CSSProperties}>
              <strong>{g.value}%</strong>
            </div>
            <span>{g.label}</span>
          </div>
        ))}
      </div>
      <p className="proto-ingest-readiness__verdict">
        {readiness.validationScore >= 70
          ? 'Strong ingestion package — proceed to testing and validation.'
          : readiness.validationScore >= 40
            ? 'Add documentation and core assets before validation.'
            : 'Incomplete package — upload builds, docs, and metadata.'}
      </p>
    </section>
  );
}
