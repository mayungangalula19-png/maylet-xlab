import { useState } from 'react';

interface Props {
  initialConfig?: string;
  running?: boolean;
  onRun: (config: string) => void;
}

export function BuildEditor({ initialConfig = '', running, onRun }: Props) {
  const [config, setConfig] = useState(initialConfig);

  return (
    <div className="proto-panel">
      <h3>Build configuration</h3>
      <textarea
        className="proto-textarea"
        rows={8}
        value={config}
        onChange={(e) => setConfig(e.target.value)}
        placeholder={'# prototype build config\nentry: src/main.tsx\ntarget: web'}
      />
      <button type="button" className="proto-btn proto-btn--primary" disabled={running} onClick={() => onRun(config)}>
        {running ? 'Building…' : 'Run build'}
      </button>
    </div>
  );
}
