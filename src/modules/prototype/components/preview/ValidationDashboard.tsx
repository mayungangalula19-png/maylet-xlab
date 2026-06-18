import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { PrototypeTestRun } from '../../types/prototype.types';

interface Props {
  meta: PrototypeBuilderMeta;
  passRate: number;
  readinessScore: number | null;
  tests: PrototypeTestRun[];
  avgRating: number | null;
}

export function ValidationDashboard({ meta, passRate, readinessScore, tests, avgRating }: Props) {
  const v = meta.validation;
  const validationScore = v.validationScore ?? Math.round(passRate * 100);
  const readiness = readinessScore ?? validationScore;

  return (
    <section id="proto-preview-validation" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Validation dashboard</h2>
        <p>Testing results, feedback, and readiness indicators.</p>
      </header>

      <div className="proto-preview-validation-grid">
        <div className="proto-preview-stat proto-preview-stat--primary">
          <span>Validation score</span>
          <strong>{validationScore}%</strong>
        </div>
        <div className="proto-preview-stat">
          <span>Success rate</span>
          <strong>{Math.round(passRate * 100)}%</strong>
        </div>
        <div className="proto-preview-stat">
          <span>Readiness index</span>
          <strong>{readiness}%</strong>
        </div>
        <div className="proto-preview-stat">
          <span>Reviewer rating</span>
          <strong>{avgRating != null ? `${avgRating.toFixed(1)}/5` : v.userRatings != null ? `${v.userRatings}/5` : '—'}</strong>
        </div>
      </div>

      <div className="proto-preview-validation-detail">
        {v.feedback ? (
          <article>
            <h3>User feedback</h3>
            <p>{v.feedback}</p>
          </article>
        ) : null}
        {v.testResults ? (
          <article>
            <h3>Testing results</h3>
            <p>{v.testResults}</p>
          </article>
        ) : null}
        {meta.adoptionIndicators ? (
          <article>
            <h3>Adoption indicators</h3>
            <p>{meta.adoptionIndicators}</p>
          </article>
        ) : null}
      </div>

      {tests.length > 0 ? (
        <div className="proto-preview-test-runs">
          <h3>Test runs ({tests.length})</h3>
          <ul>
            {tests.slice(0, 5).map((t) => (
              <li key={t.id}>
                <span className={`proto-preview-test-verdict proto-preview-test-verdict--${t.verdict}`}>{t.verdict}</span>
                <span>{t.name}</span>
                <time>{new Date(t.created_at).toLocaleDateString()}</time>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
