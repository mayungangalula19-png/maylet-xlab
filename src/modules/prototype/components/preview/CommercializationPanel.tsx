import type { CommercialReadiness } from '../../types/prototypePreview.types';

interface Props {
  readiness: CommercialReadiness;
}

const SIGNAL_LABELS = { green: 'Ready', yellow: 'Caution', red: 'At risk' } as const;

function SignalCard({
  label,
  score,
  signal,
}: {
  label: string;
  score: number;
  signal: CommercialReadiness['market'];
}) {
  return (
    <article className={`proto-preview-signal proto-preview-signal--${signal}`}>
      <span className="proto-preview-signal__dot" aria-hidden />
      <div>
        <h3>{label}</h3>
        <strong>{score}%</strong>
        <span>{SIGNAL_LABELS[signal]}</span>
      </div>
    </article>
  );
}

export function CommercializationPanel({ readiness }: Props) {
  return (
    <section id="proto-preview-commercial" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Commercialization readiness</h2>
        <p>Market, scalability, funding, and risk assessment.</p>
      </header>
      <div className="proto-preview-signal-grid">
        <SignalCard label="Market readiness" score={readiness.marketScore} signal={readiness.market} />
        <SignalCard label="Scalability" score={readiness.scalabilityScore} signal={readiness.scalability} />
        <SignalCard label="Funding readiness" score={readiness.fundingScore} signal={readiness.funding} />
        <SignalCard label="Risk assessment" score={readiness.riskScore} signal={readiness.risk} />
      </div>
    </section>
  );
}
