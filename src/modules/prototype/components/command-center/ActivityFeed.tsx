interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  prototypeId?: string;
  prototypeName?: string;
}

interface Props {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: Props) {
  return (
    <section className="proto-cc-activity">
      <header className="proto-cc-section-head">
        <h2>Operations feed</h2>
        <p>Real-time prototype activity</p>
      </header>
      {activities.length === 0 ? (
        <p className="proto-muted">Activity appears as teams edit prototypes in the builder.</p>
      ) : (
        <ol className="proto-cc-activity__list">
          {activities.map((a) => (
            <li key={a.id}>
              <span className={`proto-cc-activity__type proto-cc-activity__type--${a.type}`}>{a.type}</span>
              <div>
                <strong>{a.prototypeName ?? 'Prototype'}</strong>
                <p>{a.message}</p>
              </div>
              <time>{new Date(a.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CollaborationHub({ activities }: Props) {
  const comments = activities.filter((a) => a.type === 'comment');
  return (
    <div className="proto-cc-collab">
      <h3>Collaboration</h3>
      <p>{comments.length} recent comments · review requests via validation module</p>
      {comments.slice(0, 3).map((c) => (
        <div key={c.id} className="proto-cc-collab__item">
          <strong>{c.prototypeName}</strong>
          <p>{c.message}</p>
        </div>
      ))}
    </div>
  );
}
