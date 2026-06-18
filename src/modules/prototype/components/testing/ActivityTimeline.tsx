import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  compact?: boolean;
}

export function ActivityTimeline({ workspace, compact }: Props) {
  const events = [
    ...workspace.activity,
    ...workspace.defects.map((d) => ({
      id: d.id,
      type: 'defect' as const,
      message: `Defect: ${d.title}`,
      createdAt: d.createdAt,
    })),
    ...workspace.evidence.map((e) => ({
      id: e.id,
      type: 'evidence' as const,
      message: `Evidence uploaded: ${e.label || e.kind}`,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const limit = compact ? 8 : 20;

  return (
    <section className={`proto-test-panel${compact ? ' proto-test-panel--compact' : ''}`}>
      <header className="proto-test-panel__head"><h2>Activity timeline</h2></header>
      {events.length === 0 ? (
        <p className="proto-muted">Test executions, defects, evidence, and validation events appear here.</p>
      ) : (
        <ol className="proto-test-timeline">
          {events.slice(0, limit).map((e) => (
            <li key={e.id}>
              <span className={`proto-test-timeline__type proto-test-timeline__type--${e.type}`}>{e.type}</span>
              <span>{e.message}</span>
              <time>{new Date(e.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** @deprecated Use ActivityTimeline */
export const TestingActivityTimeline = ActivityTimeline;
