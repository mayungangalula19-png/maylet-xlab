import type { PrototypeTestingWorkspace } from '../types/prototypeTesting.types';
import { emptyTestingWorkspace } from '../types/prototypeTesting.types';

const PREFIX = 'maylet-proto-testing:';

export function loadTestingWorkspace(prototypeId: string): PrototypeTestingWorkspace {
  try {
    const raw = localStorage.getItem(`${PREFIX}${prototypeId}`);
    if (!raw) return emptyTestingWorkspace();
    const parsed = JSON.parse(raw) as PrototypeTestingWorkspace;
    if (parsed.version !== 1) return emptyTestingWorkspace();
    return parsed;
  } catch {
    return emptyTestingWorkspace();
  }
}

export function saveTestingWorkspace(prototypeId: string, workspace: PrototypeTestingWorkspace): void {
  const payload = { ...workspace, updatedAt: new Date().toISOString() };
  localStorage.setItem(`${PREFIX}${prototypeId}`, JSON.stringify(payload));
}
