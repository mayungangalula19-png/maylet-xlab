import type { TestingKPIs, ReadinessScores } from '../../utils/testingCenter.utils';

interface Props {
  kpis: TestingKPIs;
  readiness: ReadinessScores;
}

export function TestingCommandCenter({ kpis, readiness }: Props) {
  const cards = [
    { label: 'Total test cases', value: kpis.totalCases },
    { label: 'Passed', value: kpis.passed, trend: kpis.passTrend, trendLabel: '% pass rate' },
    { label: 'Failed', value: kpis.failed, warn: true, trend: kpis.failed, trendLabel: 'open failures' },
    { label: 'Blocked', value: kpis.blocked },
    { label: 'Pending', value: kpis.pending },
    { label: 'Critical defects', value: kpis.criticalIssues, warn: kpis.criticalIssues > 0 },
    { label: 'Quality score', value: `${kpis.qualityScore}%`, primary: true },
    { label: 'Readiness score', value: `${readiness.readinessIndex}%`, trend: readiness.completionPct, trendLabel: '% complete' },
  ];

  return (
    <section className="proto-test-kpis" aria-label="Testing KPI dashboard">
      {cards.map((c) => (
        <article
          key={c.label}
          className={`proto-test-kpi${c.warn ? ' proto-test-kpi--warn' : ''}${c.primary ? ' proto-test-kpi--primary' : ''}`}
        >
          <strong>{c.value}</strong>
          <span>{c.label}</span>
          {c.trend != null ? (
            <em className={`proto-test-kpi__trend${c.warn ? ' proto-test-kpi__trend--down' : ''}`}>
              {c.trend}{c.trendLabel}
            </em>
          ) : null}
        </article>
      ))}
    </section>
  );
}

/** @deprecated Use TestingCommandCenter */
export const TestingDashboardKPIs = TestingCommandCenter;
