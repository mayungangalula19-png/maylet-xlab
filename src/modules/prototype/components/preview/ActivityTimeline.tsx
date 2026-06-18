import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { PrototypeReview } from '../../types/prototypePreview.types';
import type { PrototypeRecord, PrototypeTestRun } from '../../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  meta: PrototypeBuilderMeta;
  reviews: PrototypeReview[];
  tests: PrototypeTestRun[];
}

export function ActivityTimeline({ prototype, meta, reviews, tests }: Props) {
  const events: { id: string; date: string; title: string; type: string }[] = [
    {
      id: 'created',
      date: prototype.created_at,
      title: 'Prototype created',
      type: 'creation',
    },
    {
      id: 'updated',
      date: prototype.updated_at,
      title: 'Last updated',
      type: 'update',
    },
    ...meta.activity.slice(0, 10).map((a) => ({
      id: a.id,
      date: a.createdAt,
      title: a.message,
      type: a.type,
    })),
    ...tests.slice(0, 5).map((t) => ({
      id: t.id,
      date: t.created_at,
      title: `Test: ${t.name} — ${t.verdict}`,
      type: 'validation',
    })),
    ...reviews.slice(0, 5).map((r) => ({
      id: r.id,
      date: r.createdAt,
      title: `Review by ${r.author} — ${r.decision}`,
      type: 'review',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section id="proto-preview-activity" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Activity timeline</h2>
        <p>Creation, updates, validation, and review events.</p>
      </header>
      <ol className="proto-preview-timeline">
        {events.map((e) => (
          <li key={e.id} className={`proto-preview-timeline__item proto-preview-timeline__item--${e.type}`}>
            <span className="proto-preview-timeline__dot" />
            <div>
              <strong>{e.title}</strong>
              <time>{new Date(e.date).toLocaleString()}</time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
