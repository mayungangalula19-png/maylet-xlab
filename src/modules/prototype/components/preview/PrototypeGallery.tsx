import { PrototypeImageGallery } from '../PrototypeImageGallery';
import type { PrototypeScreenshot } from '../../types/prototype.types';

interface Props {
  screenshots: PrototypeScreenshot[];
  prototypeName: string;
}

export function PrototypeGallery({ screenshots, prototypeName }: Props) {
  return (
    <section id="proto-preview-showcase" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Visual showcase</h2>
        <p>UI mockups, product images, architecture diagrams, and demo visuals.</p>
      </header>
      <PrototypeImageGallery screenshots={screenshots} prototypeName={prototypeName} />
    </section>
  );
}
