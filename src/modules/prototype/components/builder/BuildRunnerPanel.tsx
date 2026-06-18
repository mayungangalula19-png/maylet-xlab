import { BuildEditor } from '../BuildEditor';
import { VersionHistory } from '../VersionHistory';
import type { PrototypeBuild, PrototypeRecord } from '../../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  builds: PrototypeBuild[];
  running?: boolean;
  lastBuild?: PrototypeBuild | null;
  buildError?: string | null;
  onRun: (config: string) => Promise<void>;
}

export function BuildRunnerPanel({ prototype, builds, running, lastBuild, buildError, onRun }: Props) {
  return (
    <section id="proto-builder-build" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Build runner</h2>
        <p>Configure and execute prototype builds with version tracking.</p>
      </header>

      {buildError ? <p className="proto-error">{buildError}</p> : null}

      <BuildEditor running={running} onRun={(config) => void onRun(config)} />

      {lastBuild ? (
        <div className="proto-panel" style={{ marginTop: '1rem' }}>
          <h3>Last build — {lastBuild.status}</h3>
          <pre className="proto-logs">{lastBuild.logs.join('\n')}</pre>
        </div>
      ) : null}

      <VersionHistory prototype={prototype} builds={builds} />
    </section>
  );
}
