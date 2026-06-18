import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  launch: PortfolioItem[];
  adoption: PortfolioItem[];
  pipeline: PortfolioItem[];
}

export function CommercializationCenter({ launch, adoption, pipeline }: Props) {
  return (
    <section className="proto-cc-center">
      <header className="proto-cc-center__head">
        <h3>Commercialization</h3>
        <span className="proto-cc-center__badge">{pipeline.length} in pipeline</span>
      </header>
      <div className="proto-cc-gauges">
        <div className="proto-cc-gauge">
          <strong>{launch.length}</strong>
          <span>Launch ready</span>
        </div>
        <div className="proto-cc-gauge">
          <strong>{adoption.length}</strong>
          <span>Adoption signals</span>
        </div>
        <div className="proto-cc-gauge">
          <strong>{pipeline.length ? Math.round(pipeline.reduce((s, p) => s + p.fundingScore, 0) / pipeline.length) : 0}%</strong>
          <span>Scaling potential</span>
        </div>
      </div>
      <div className="proto-cc-commercial-pipeline">
        {['Funding', 'GTM', 'Launch', 'Scale'].map((step, i) => (
          <div key={step} className={`proto-cc-commercial-step${i < pipeline.length ? ' proto-cc-commercial-step--active' : ''}`}>
            {step}
          </div>
        ))}
      </div>
    </section>
  );
}
