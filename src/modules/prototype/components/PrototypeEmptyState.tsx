import { Link } from 'react-router-dom';

interface Props {
  onCreate?: () => void;
  projectId?: string;
  researchId?: string;
}

export function PrototypeEmptyState({ onCreate, projectId, researchId }: Props) {
  const newHref =
    projectId || researchId
      ? `/prototypes/new?${new URLSearchParams({
          ...(projectId ? { projectId } : {}),
          ...(researchId ? { researchId } : {}),
        }).toString()}`
      : '/prototypes/new';

  return (
    <div className="proto-empty-state">
      <h3>No prototypes yet</h3>
      <p>
        Build, test, and version real innovation artifacts — separate from research notes and project tasks.
      </p>
      {onCreate ? (
        <button type="button" className="proto-btn proto-btn--primary" onClick={onCreate}>
          + New prototype
        </button>
      ) : (
        <Link to={newHref} className="proto-btn proto-btn--primary">
          + New prototype
        </Link>
      )}
    </div>
  );
}
