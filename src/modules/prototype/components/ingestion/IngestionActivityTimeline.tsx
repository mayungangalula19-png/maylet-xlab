import type { PrototypeIngestionWorkspace } from '../../types/prototypeIngestion.types';

export function IngestionActivityTimeline({ workspace }: { workspace: PrototypeIngestionWorkspace }) {
  const events = [...workspace.activity].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head"><h2>Activity timeline</h2></header>
      {events.length === 0 ? (
        <p className="proto-muted">Upload, import, and processing events appear here.</p>
      ) : (
        <ol className="proto-ingest-timeline">
          {events.slice(0, 25).map((e) => (
            <li key={e.id}>
              <span className={`proto-ingest-timeline__type proto-ingest-timeline__type--${e.type}`}>{e.type}</span>
              <span>{e.message}</span>
              <time>{new Date(e.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      )}
      {workspace.auditLog.length > 0 ? (
        <details className="proto-ingest-audit">
          <summary>Audit log ({workspace.auditLog.length})</summary>
          <ul>
            {workspace.auditLog.slice(0, 10).map((a) => (
              <li key={a.id}><time>{new Date(a.createdAt).toLocaleString()}</time> {a.detail}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
