import { ProtoSectionShell } from './ProtoSectionShell';
import { VisualProofSection } from '../VisualProofSection';
import type { PrototypeScreenshot } from '../../types/prototype.types';

interface Props {
  completion: number;
  prototypeId: string | null;
  userId: string;
  prototypeName: string;
  screenshots: PrototypeScreenshot[];
  saving?: boolean;
  onEnsureRecord: () => Promise<string | null>;
  onRefresh: () => void;
}

export function PrototypeVisualsSection({
  completion,
  prototypeId,
  userId,
  prototypeName,
  screenshots,
  saving,
  onEnsureRecord,
  onRefresh,
}: Props) {
  return (
    <ProtoSectionShell
      id="visuals"
      title="Prototype visuals"
      description="Screenshots, UI mockups, architecture diagrams, and demo images."
      completion={completion}
    >
      {prototypeId ? (
        <VisualProofSection
          prototypeId={prototypeId}
          userId={userId}
          prototypeName={prototypeName}
          screenshots={screenshots}
          onChange={onRefresh}
        />
      ) : (
        <div className="proto-visuals-placeholder">
          <p className="proto-muted">
            Enter a prototype name (3+ characters) to enable visual uploads. A draft record is created automatically on save.
          </p>
          <button
            type="button"
            className="proto-btn proto-btn--secondary"
            disabled={saving || prototypeName.trim().length < 3}
            onClick={() => void onEnsureRecord()}
          >
            {saving ? 'Creating draft…' : 'Enable visual gallery'}
          </button>
        </div>
      )}
    </ProtoSectionShell>
  );
}
