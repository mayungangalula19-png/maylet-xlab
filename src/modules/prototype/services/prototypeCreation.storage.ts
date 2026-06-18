import type { PrototypeCreationDraft } from '../types/prototypeCreation.types';
import { emptyPrototypeDraft } from '../types/prototypeCreation.types';

const DRAFT_PREFIX = 'maylet-proto-draft:';
const META_PREFIX = 'maylet-proto-meta:';

export function draftStorageKey(userId: string, draftKey: string): string {
  return `${DRAFT_PREFIX}${userId}:${draftKey}`;
}

export function metaStorageKey(prototypeId: string): string {
  return `${META_PREFIX}${prototypeId}`;
}

export function loadDraft(userId: string, draftKey: string): PrototypeCreationDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(userId, draftKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrototypeCreationDraft;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draftKey: string, draft: PrototypeCreationDraft): void {
  const payload = { ...draft, updatedAt: new Date().toISOString() };
  localStorage.setItem(draftStorageKey(userId, draftKey), JSON.stringify(payload));
}

export function clearDraft(userId: string, draftKey: string): void {
  localStorage.removeItem(draftStorageKey(userId, draftKey));
}

export function loadPrototypeMeta(prototypeId: string): PrototypeCreationDraft | null {
  try {
    const raw = localStorage.getItem(metaStorageKey(prototypeId));
    if (!raw) return null;
    return JSON.parse(raw) as PrototypeCreationDraft;
  } catch {
    return null;
  }
}

export function savePrototypeMeta(prototypeId: string, draft: PrototypeCreationDraft): void {
  const payload = { ...draft, updatedAt: new Date().toISOString() };
  localStorage.setItem(metaStorageKey(prototypeId), JSON.stringify(payload));
}

export function mergeMetaWithDefaults(
  prototypeId: string,
  partial?: Partial<PrototypeCreationDraft>
): PrototypeCreationDraft {
  return {
    ...emptyPrototypeDraft(),
    ...loadPrototypeMeta(prototypeId),
    ...partial,
    version: 1,
  };
}
