import type {
  PrototypeCreationDraft,
  PrototypeWorkspaceStage,
} from './prototypeCreation.types';
import { WORKSPACE_STAGES, emptyPrototypeDraft } from './prototypeCreation.types';

export type BuilderSectionId =
  | 'overview'
  | 'visuals'
  | 'flow'
  | 'features'
  | 'architecture'
  | 'experiments'
  | 'validation'
  | 'documentation'
  | 'attachments'
  | 'lifecycle'
  | 'collaboration'
  | 'build';

export type BuilderFeatureStatus = 'planned' | 'building' | 'testing' | 'complete';
export type FlowViewMode = 'timeline' | 'nodes';

export interface BuilderComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface BuilderActivity {
  id: string;
  type: 'edit' | 'comment' | 'upload' | 'status';
  message: string;
  createdAt: string;
}

/** Extended meta persisted alongside prototype record */
export interface PrototypeBuilderMeta extends PrototypeCreationDraft {
  documentation: string;
  architectureNotes: string;
  serviceInventory: string;
  flowViewMode: FlowViewMode;
  adoptionIndicators: string;
  comments: BuilderComment[];
  activity: BuilderActivity[];
}

export const BUILDER_NAV_GROUPS: {
  label: string;
  items: { id: BuilderSectionId; label: string; icon: string }[];
}[] = [
  {
    label: 'Navigator',
    items: [{ id: 'overview', label: 'Overview', icon: '📋' }],
  },
  {
    label: 'Design',
    items: [
      { id: 'visuals', label: 'Visual builder', icon: '🖼️' },
      { id: 'flow', label: 'User flow', icon: '🔀' },
      { id: 'features', label: 'Features', icon: '⚡' },
      { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    ],
  },
  {
    label: 'Assets',
    items: [
      { id: 'documentation', label: 'Documentation', icon: '📄' },
      { id: 'attachments', label: 'Attachments', icon: '📎' },
    ],
  },
  {
    label: 'Innovation',
    items: [
      { id: 'experiments', label: 'Experiments', icon: '🧪' },
      { id: 'validation', label: 'Validation', icon: '✅' },
      { id: 'lifecycle', label: 'Lifecycle', icon: '🚦' },
    ],
  },
  {
    label: 'Team',
    items: [
      { id: 'collaboration', label: 'Collaboration', icon: '👥' },
      { id: 'build', label: 'Build runner', icon: '⚙️' },
    ],
  },
];

export const INNOVATION_PIPELINE: { id: PrototypeWorkspaceStage | 'idea' | 'research'; label: string }[] = [
  { id: 'idea', label: 'Idea' },
  { id: 'research', label: 'Research' },
  ...WORKSPACE_STAGES,
];

export const BUILDER_FEATURE_STATUSES: { id: BuilderFeatureStatus; label: string }[] = [
  { id: 'planned', label: 'Planned' },
  { id: 'building', label: 'Building' },
  { id: 'testing', label: 'Testing' },
  { id: 'complete', label: 'Complete' },
];

export function emptyBuilderMeta(
  partial?: Partial<PrototypeBuilderMeta>
): PrototypeBuilderMeta {
  return {
    ...emptyPrototypeDraft(),
    documentation: '',
    architectureNotes: '',
    serviceInventory: '',
    flowViewMode: 'timeline',
    adoptionIndicators: '',
    comments: [],
    activity: [],
    ...partial,
    version: 1,
  };
}

export function newBuilderId(): string {
  return crypto.randomUUID();
}
