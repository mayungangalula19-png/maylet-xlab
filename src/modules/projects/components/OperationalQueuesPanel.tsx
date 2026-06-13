import { Link } from 'react-router-dom';
import { EMPTY } from '../../../lib/innovation/dashboardData';
import type { OperationalProjectItem } from '../../../lib/innovation/operational';

interface Props {
  actionRequired: OperationalProjectItem[];
  completeSetup: OperationalProjectItem[];
  fundingReady: OperationalProjectItem[];
  validationReady: OperationalProjectItem[];
}

function Queue({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: OperationalProjectItem[];
  emptyLabel: string;
}) {
  return (
    <div className="icc-priority-col">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="icc-queue-empty-label">{emptyLabel}</p>
      ) : (
        items.map((item) => (
          <Link key={item.id} to={item.route} className="icc-priority-item icc-clickable">
            <span>{item.name}</span>
            <span className="icc-priority-detail">{item.detail}</span>
          </Link>
        ))
      )}
    </div>
  );
}

export function OperationalQueuesPanel({
  actionRequired,
  completeSetup,
  fundingReady,
  validationReady,
}: Props) {
  return (
    <div className="icc-glass icc-widget icc-priorities">
      <div className="icc-widget-header">
        <h3>Queues</h3>
        <Link to="/projects" className="icc-widget-link">Portfolio</Link>
      </div>
      <div className="icc-priorities-grid">
        <Queue title="Action Required" items={actionRequired} emptyLabel={EMPTY.NO_DATA} />
        <Queue title="Setup" items={completeSetup} emptyLabel={EMPTY.COMPLETE_SETUP} />
        <Queue title="Funding" items={fundingReady} emptyLabel={EMPTY.NOT_AVAILABLE} />
        <Queue title="Validation" items={validationReady} emptyLabel={EMPTY.NOT_AVAILABLE} />
      </div>
    </div>
  );
}
