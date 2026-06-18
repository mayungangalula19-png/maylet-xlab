import type { IngestionAsset, IngestionStatus } from '../../types/prototypeIngestion.types';

const STATUS_ORDER: IngestionStatus[] = ['pending', 'uploading', 'processing', 'analyzing', 'ready', 'failed'];

interface Props {
  assets: IngestionAsset[];
}

export function UploadProgressTracker({ assets }: Props) {
  const counts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: assets.filter((a) => a.status === s).length }),
    {} as Record<IngestionStatus, number>
  );

  return (
    <section className="proto-ingest-panel proto-ingest-panel--compact">
      <h2>Processing pipeline</h2>
      <ul className="proto-ingest-pipeline">
        {STATUS_ORDER.map((s) => (
          <li key={s} className={`proto-ingest-pipeline__step proto-ingest-pipeline__step--${s}`}>
            <span>{s}</span>
            <strong>{counts[s]}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
