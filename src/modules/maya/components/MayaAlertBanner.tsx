import type { MayaAlert } from '../ai/types';

interface Props {
  alerts: MayaAlert[];
}

export function MayaAlertBanner({ alerts }: Props) {
  const active = alerts.filter((a) => !a.dismissed).slice(0, 2);
  if (active.length === 0) {
    return (
      <div className="maya-alert">
        <strong>🔮 MAYA</strong>
        <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>
          Proactive mode: I will alert you when projects stall, budgets drift, or experiments need review.
        </p>
      </div>
    );
  }

  return (
    <>
      {active.map((a) => (
        <div key={a.id} className="maya-alert">
          <strong>
            {a.severity === 'critical' ? '🚨' : a.severity === 'warning' ? '⚠️' : '🔮'} {a.title}
          </strong>
          <p style={{ margin: '0.35rem 0 0' }}>{a.message}</p>
        </div>
      ))}
    </>
  );
}
