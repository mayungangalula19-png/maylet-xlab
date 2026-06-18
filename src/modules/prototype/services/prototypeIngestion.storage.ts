import type { PrototypeIngestionWorkspace } from '../types/prototypeIngestion.types';
import { emptyIngestionWorkspace } from '../types/prototypeIngestion.types';

const PREFIX = 'maylet-proto-ingest:';

export function ingestionStorageKey(userId: string, prototypeId?: string): string {
  return `${PREFIX}${prototypeId ?? userId}`;
}

export function loadIngestionWorkspace(userId: string, prototypeId?: string): PrototypeIngestionWorkspace {
  try {
    const raw = localStorage.getItem(ingestionStorageKey(userId, prototypeId));
    if (!raw) return emptyIngestionWorkspace();
    const parsed = JSON.parse(raw) as PrototypeIngestionWorkspace;
    if (parsed.version !== 1) return emptyIngestionWorkspace();
    return parsed;
  } catch {
    return emptyIngestionWorkspace();
  }
}

export function saveIngestionWorkspace(
  userId: string,
  workspace: PrototypeIngestionWorkspace,
  prototypeId?: string
): void {
  const payload = { ...workspace, updatedAt: new Date().toISOString() };
  localStorage.setItem(ingestionStorageKey(userId, prototypeId), JSON.stringify(payload));
}
