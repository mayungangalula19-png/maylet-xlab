import { VisualProofSection } from '../VisualProofSection';
import type { PrototypeScreenshot } from '../../types/prototype.types';

interface Props {
  prototypeId: string;
  userId: string;
  prototypeName: string;
  screenshots: PrototypeScreenshot[];
  onChange: () => void;
}

export function VisualBuilder({ prototypeId, userId, prototypeName, screenshots, onChange }: Props) {
  return (
    <section id="proto-builder-visuals" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Visual builder</h2>
        <p>UI screenshots, wireframes, mockups, architecture diagrams, and demo images.</p>
      </header>
      <VisualProofSection
        prototypeId={prototypeId}
        userId={userId}
        prototypeName={prototypeName}
        screenshots={screenshots}
        onChange={onChange}
      />
    </section>
  );
}
