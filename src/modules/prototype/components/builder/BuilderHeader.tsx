import { Link } from 'react-router-dom';
import type { SaveState } from '../../hooks/usePrototypeCreation';
import type { PrototypeRecord } from '../../types/prototype.types';
import { LIFECYCLE_LABELS } from '../../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  completion: number;
  saveState: SaveState;
  onSaveNow: () => void;
}

function saveLabel(state: SaveState): string {
  switch (state) {
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'All changes saved';
    case 'dirty':
      return 'Unsaved changes';
    case 'error':
      return 'Save error';
    default:
      return 'Ready';
  }
}

export function BuilderHeader({ prototype, completion, saveState, onSaveNow }: Props) {
  return (
    <header className="proto-builder-header">
      <div className="proto-builder-header__main">
        <nav className="proto-breadcrumb">
          <Link to="/prototypes">Prototypes</Link>
          <span>/</span>
          <Link to={`/prototypes/${prototype.id}/workspace`}>{prototype.name}</Link>
          <span>/</span>
          <span>Builder</span>
        </nav>
        <h1>{prototype.name}</h1>
        <p className="proto-builder-header__sub">
          v{prototype.version} · {LIFECYCLE_LABELS[prototype.lifecycle_status]} · {completion}% complete
        </p>
      </div>
      <div className="proto-builder-header__actions">
        <span className={`proto-create-save proto-create-save--${saveState}`}>{saveLabel(saveState)}</span>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onSaveNow}>
          Save now
        </button>
        <Link to={`/prototypes/${prototype.id}/workspace`} className="proto-btn proto-btn--ghost">
          Workspace
        </Link>
        <Link to={`/prototypes/${prototype.id}/testing`} className="proto-btn proto-btn--primary">
          Run tests
        </Link>
      </div>
    </header>
  );
}
