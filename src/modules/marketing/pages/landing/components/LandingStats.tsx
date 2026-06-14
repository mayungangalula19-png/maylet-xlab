import { AnimatedCounter } from './AnimatedCounter';
import type { PlatformStat } from '../landing.types';

interface Props {
  stats: PlatformStat[];
}

export function LandingStats({ stats }: Props) {
  return (
    <section className="lp-stats" aria-label="Platform statistics">
      {stats.map((stat) => (
        <div key={stat.id} className="lp-stat fade-in-up">
          <div className="lp-stat__value">
            <AnimatedCounter target={stat.targetValue} prefix={stat.prefix} suffix={stat.suffix} />
          </div>
          <div className="lp-stat__label">{stat.label}</div>
          <div className="lp-stat__desc">{stat.description}</div>
        </div>
      ))}
    </section>
  );
}
