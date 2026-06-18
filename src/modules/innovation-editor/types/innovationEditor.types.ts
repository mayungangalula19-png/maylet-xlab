import type { WorkflowStageId } from '../../workflow/types/workflow.types';

export type InnovationEntityType =
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'testing'
  | 'validation'
  | 'funding'
  | 'commercialization';

export type InnovationSaveMode = 'draft' | 'autosave' | 'publish';

export interface InnovationEntityVersion {
  id: string;
  entity_type: InnovationEntityType;
  entity_id: string;
  project_id: string | null;
  version_number: number;
  snapshot: Record<string, unknown>;
  change_summary: string | null;
  save_mode: InnovationSaveMode;
  created_at: string;
}

export interface InnovationEditorActivity {
  id: string;
  title: string;
  type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface InnovationPersistResult<TRecord = Record<string, unknown>> {
  entityId: string;
  record: TRecord;
}

export interface InnovationEntityAdapter<TValues, TRecord = unknown> {
  entityType: InnovationEntityType;
  workflowStageId: WorkflowStageId;
  entityLabel: string;
  load: (entityId: string) => Promise<TRecord>;
  toValues: (record: TRecord) => TValues;
  validate: (values: TValues, mode: InnovationSaveMode) => string | null;
  persist: (
    values: TValues,
    ctx: {
      entityId: string;
      projectId: string | null;
      userId: string;
      mode: InnovationSaveMode;
    }
  ) => Promise<InnovationPersistResult<TRecord>>;
  readinessScore?: (values: TValues) => number;
}

export interface InnovationEditorState<TValues> {
  values: TValues;
  baseline: TValues;
  dirty: boolean;
  saving: boolean;
  autosaving: boolean;
  publishing: boolean;
  error: string | null;
  lastSavedAt: string | null;
  lastAutosaveAt: string | null;
  optimisticEntityId: string | null;
  versions: InnovationEntityVersion[];
  activities: InnovationEditorActivity[];
}
