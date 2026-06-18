import { Link } from 'react-router-dom';
import type { SaveState } from '../../hooks/usePrototypeCreation';

interface Props {
  name: string;
  completion: number;
  saveState: SaveState;
  workspaceStage: string;
  onBack: () => void;
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
      return 'Draft mode';
  }
}

export function PrototypeHeader({ name, completion, saveState, workspaceStage, onBack }: Props) {
  return (
    <header className="proto-create-header">
      <div className="proto-create-header__main">
        <nav className="proto-breadcrumb">
          <Link to="/prototypes">Prototypes</Link>
          <span>/</span>
          <span>New workspace</span>
        </nav>
        <h1>{name.trim() || 'Prototype creation workspace'}</h1>
        <p className="proto-create-header__sub">
          Enterprise prototype lifecycle · {completion}% complete · {workspaceStage.replace('_', ' ')}
        </p>
      </div>
      <div className="proto-create-header__meta">
        <span className={`proto-create-save proto-create-save--${saveState}`}>{saveLabel(saveState)}</span>
        <button type="button" className="proto-btn proto-btn--ghost" onClick={onBack}>
          ← Exit
        </button>
      </div>
    </header>
  );
}
