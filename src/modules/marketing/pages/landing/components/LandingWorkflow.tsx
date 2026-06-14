import { Link } from 'react-router-dom';
import { SectionHeading } from './SectionHeading';
import type { FlowStep } from '../landing.types';

interface Props {
  steps: FlowStep[];
}

export function LandingWorkflow({ steps }: Props) {
  return (
    <section className="lp-workflow" id="workflow">
      <SectionHeading
        kicker="Innovation workflow"
        title={
          <>
            Your path from <span>Idea to Commercialization</span>
          </>
        }
        subtitle="Seven connected stages — one platform, zero handoffs"
      />

      <div className="lp-workflow-track">
        {steps.map((step, idx) => (
          <Link to={step.route} key={step.id} className="lp-workflow-step fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="lp-workflow-step__num">{String(idx + 1).padStart(2, '0')}</div>
            <div className="lp-workflow-step__icon">{step.icon}</div>
            <div className="lp-workflow-step__label">{step.label}</div>
            <div className="lp-workflow-step__desc">{step.description}</div>
            {idx < steps.length - 1 && <div className="lp-workflow-step__line" aria-hidden />}
          </Link>
        ))}
      </div>
    </section>
  );
}
