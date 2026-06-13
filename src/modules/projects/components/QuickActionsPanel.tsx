import { Link } from 'react-router-dom';

interface Action {
  label: string;
  route?: string;
  onClick?: () => void;
  primary?: boolean;
}

interface Props {
  onCreateProject: () => void;
}

export function QuickActionsPanel({ onCreateProject }: Props) {
  const actions: Action[] = [
    { label: 'New Project', onClick: onCreateProject, primary: true },
    { label: 'Research', route: '/research' },
    { label: 'Experiment', route: '/experiments/create' },
    { label: 'Upload', route: '/research' },
    { label: 'Invite Team', route: '/teams/create' },
    { label: 'Funding', route: '/funding' },
    { label: 'MAYA', route: '/ai-assistant' },
  ];

  return (
    <div className="icc-glass icc-quick-actions">
      {actions.map((action) =>
        action.onClick ? (
          <button
            key={action.label}
            type="button"
            className={`icc-quick-btn${action.primary ? ' icc-quick-btn--primary' : ''}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ) : (
          <Link
            key={action.label}
            to={action.route!}
            className={`icc-quick-btn${action.primary ? ' icc-quick-btn--primary' : ''}`}
          >
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}
