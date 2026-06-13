import type { PrototypeBuild, PrototypeRecord, PrototypeVersion } from '../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  builds: PrototypeBuild[];
  versions?: PrototypeVersion[];
}

export function VersionHistory({ prototype, builds, versions: externalVersions }: Props) {
  const versions =
    externalVersions ??
    [
      {
        id: 'current',
        prototype_id: prototype.id,
        version: prototype.version,
        changelog: 'Current version',
        file_url: prototype.file_url,
        created_at: prototype.updated_at,
      },
      ...builds.slice(0, 5).map((b) => ({
        id: b.id,
        prototype_id: prototype.id,
        version: prototype.version,
        changelog: `${b.status} — ${b.build_config?.slice(0, 40) ?? 'default'}`,
        file_url: b.output_url,
        created_at: b.completed_at ?? b.started_at,
      })),
    ];

  return (
    <div className="proto-panel">
      <h3>Version history</h3>
      {versions.length === 0 ? (
        <p className="proto-empty">No versions yet.</p>
      ) : (
        <ul className="proto-version-list">
          {versions.map((v) => (
            <li key={v.id}>
              <strong>v{v.version}</strong>
              <span>{new Date(v.created_at).toLocaleString()}</span>
              <p>{v.changelog ?? '—'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
