/** Extended prototype creation workspace — persisted in localStorage until metadata column ships */

export type PrototypeWorkspaceStage =
  | 'draft'
  | 'prototype'
  | 'testing'
  | 'validation'
  | 'funding_ready'
  | 'commercialization';

export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical';
export type FeatureStatus = 'planned' | 'in_progress' | 'implemented' | 'tested';

export type AttachmentKind =
  | 'image'
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'video'
  | 'github'
  | 'figma'
  | 'other';

export interface PrototypeFeatureItem {
  id: string;
  title: string;
  description: string;
  priority: FeaturePriority;
  status: FeatureStatus;
}

export interface UserFlowStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface ExperimentLink {
  id: string;
  hypothesis: string;
  assumptions?: string;
  methodology: string;
  metrics: string;
  expectedOutcome: string;
}

export interface ValidationMetrics {
  feedback: string;
  testResults: string;
  userRatings: number | null;
  validationScore: number | null;
}

export interface AttachmentItem {
  id: string;
  kind: AttachmentKind;
  label: string;
  url: string;
  notes?: string;
}

export interface PrototypeCreationDraft {
  version: 1;
  /** Core */
  name: string;
  description: string;
  category: string;
  industry: string;
  tags: string[];
  projectId: string;
  researchId: string;
  /** Problem */
  problemStatement: string;
  targetUsers: string;
  currentLimitations: string;
  marketNeed: string;
  /** Solution */
  solutionOverview: string;
  keyInnovation: string;
  competitiveAdvantage: string;
  technicalApproach: string;
  /** Flow */
  userFlow: UserFlowStep[];
  /** Features */
  features: PrototypeFeatureItem[];
  /** Architecture */
  frontendStack: string;
  backendStack: string;
  database: string;
  apis: string;
  aiIntegrations: string;
  infrastructure: string;
  /** Experiments */
  experiments: ExperimentLink[];
  /** Validation */
  validation: ValidationMetrics;
  /** Attachments */
  attachments: AttachmentItem[];
  /** Workflow */
  workspaceStage: PrototypeWorkspaceStage;
  updatedAt: string;
}

export type CreationSectionId =
  | 'details'
  | 'visuals'
  | 'problem'
  | 'solution'
  | 'flow'
  | 'features'
  | 'architecture'
  | 'experiments'
  | 'validation'
  | 'attachments'
  | 'status';

export const CREATION_SECTIONS: { id: CreationSectionId; label: string; icon: string }[] = [
  { id: 'details', label: 'Prototype info', icon: '📋' },
  { id: 'visuals', label: 'Visual proof', icon: '🖼️' },
  { id: 'problem', label: 'Problem', icon: '🎯' },
  { id: 'solution', label: 'Solution design', icon: '💡' },
  { id: 'flow', label: 'User flow', icon: '🔀' },
  { id: 'features', label: 'Features', icon: '⚡' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'experiments', label: 'Experiments', icon: '🧪' },
  { id: 'validation', label: 'Validation', icon: '✅' },
  { id: 'attachments', label: 'Attachments', icon: '📎' },
  { id: 'status', label: 'Status', icon: '🚦' },
];

export const WORKSPACE_STAGES: { id: PrototypeWorkspaceStage; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'testing', label: 'Testing' },
  { id: 'validation', label: 'Validation' },
  { id: 'funding_ready', label: 'Funding ready' },
  { id: 'commercialization', label: 'Commercialization' },
];

export const PROTOTYPE_CATEGORIES = [
  'MVP',
  'Proof of concept',
  'UI prototype',
  'Hardware',
  'Platform',
  'Mobile app',
  'API / Service',
  'Other',
] as const;

export function emptyPrototypeDraft(
  partial?: Partial<Pick<PrototypeCreationDraft, 'projectId' | 'researchId'>>
): PrototypeCreationDraft {
  const now = new Date().toISOString();
  return {
    version: 1,
    name: '',
    description: '',
    category: 'MVP',
    industry: '',
    tags: [],
    projectId: partial?.projectId ?? '',
    researchId: partial?.researchId ?? '',
    problemStatement: '',
    targetUsers: '',
    currentLimitations: '',
    marketNeed: '',
    solutionOverview: '',
    keyInnovation: '',
    competitiveAdvantage: '',
    technicalApproach: '',
    userFlow: [],
    features: [],
    frontendStack: '',
    backendStack: '',
    database: '',
    apis: '',
    aiIntegrations: '',
    infrastructure: '',
    experiments: [],
    validation: {
      feedback: '',
      testResults: '',
      userRatings: null,
      validationScore: null,
    },
    attachments: [],
    workspaceStage: 'draft',
    updatedAt: now,
  };
}

export function newId(): string {
  return crypto.randomUUID();
}
