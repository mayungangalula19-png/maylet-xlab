export type PrototypeLifecycleStatus =
  | 'draft'
  | 'building'
  | 'testing'
  | 'success'
  | 'failed';

/** Legacy DB values still supported for reads */
export type PrototypeLegacyStatus = 'draft' | 'published' | 'archived';

export type BuildStatus = 'queued' | 'running' | 'completed' | 'failed';
export type TestVerdict = 'pass' | 'fail' | 'partial' | 'pending';
export type AiRecommendation = 'APPROVE' | 'HOLD' | 'REJECT';

export interface PrototypeRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  research_id: string | null;
  name: string;
  description: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  version: string;
  status: string;
  lifecycle_status: PrototypeLifecycleStatus;
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  project_name?: string;
  research_title?: string;
  prototypeFiles?: PrototypeFile[];
}

/** Build artifact attached to a prototype */
export type ScreenshotCategory = 'ui' | 'workflow' | 'architecture' | 'analytics' | 'other';

export interface ScreenshotInput {
  title: string;
  context?: string;
  category?: ScreenshotCategory;
}

export interface ScreenshotDescription {
  title: string;
  purpose: string;
  uxDescription: string;
  functionality: string;
  userValue: string;
}

export interface PrototypeScreenshot {
  id: string;
  prototypeId: string;
  userId: string;
  title: string;
  url: string;
  category: ScreenshotCategory;
  context: string | null;
  purpose: string | null;
  uxDescription: string | null;
  functionality: string | null;
  userValue: string | null;
  isHero: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const SCREENSHOT_CATEGORIES: { id: ScreenshotCategory; label: string }[] = [
  { id: 'ui', label: 'UI' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'other', label: 'Other' },
];

export const IMAGE_FILE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'] as const;

export function isImageFileName(fileName: string): boolean {
  return IMAGE_FILE_EXTENSIONS.includes(
    getPrototypeFileExtension(fileName) as (typeof IMAGE_FILE_EXTENSIONS)[number]
  );
}

export interface PrototypeFile {
  id: string;
  prototypeId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  uploadedAt: string;
}

export const PROTOTYPE_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

export const PROTOTYPE_ALLOWED_EXTENSIONS = [
  'zip',
  'pdf',
  'docx',
  'pptx',
  'apk',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'mp4',
  'webm',
  'stl',
  'step',
  'dwg',
] as const;

export type PrototypeAllowedExtension = (typeof PROTOTYPE_ALLOWED_EXTENSIONS)[number];

export function formatPrototypeFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getPrototypeFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function validatePrototypeUploadFile(
  file: File | null | undefined,
  maxBytes: number = PROTOTYPE_UPLOAD_MAX_BYTES
): void {
  if (!file || file.size === 0) {
    throw new Error('Please select a file to upload');
  }
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${formatPrototypeFileSize(maxBytes)}`);
  }
  const ext = getPrototypeFileExtension(file.name);
  if (!PROTOTYPE_ALLOWED_EXTENSIONS.includes(ext as PrototypeAllowedExtension)) {
    throw new Error(
      `Unsupported format ".${ext}". Allowed: ${PROTOTYPE_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(', ')}`
    );
  }
}

export interface PrototypeDashboardStats {
  total: number;
  draft: number;
  building: number;
  testing: number;
  success: number;
  failed: number;
  linkedToResearch: number;
  activeBuilds: number;
  inTesting: number;
  successful: number;
}

export function computeDashboardStats(list: PrototypeRecord[]): PrototypeDashboardStats {
  const count = (s: PrototypeLifecycleStatus) => list.filter((p) => p.lifecycle_status === s).length;
  const building = count('building');
  const testing = count('testing');
  const success = count('success');
  const failed = count('failed');
  return {
    total: list.length,
    draft: count('draft'),
    building,
    testing,
    success,
    failed,
    linkedToResearch: list.filter((p) => p.research_id || p.project_id).length,
    activeBuilds: building,
    inTesting: testing,
    successful: success,
  };
}

export interface PrototypeVersion {
  id: string;
  prototype_id: string;
  version: string;
  changelog: string | null;
  file_url: string | null;
  created_at: string;
}

export interface PrototypeBuild {
  id: string;
  prototype_id: string;
  status: BuildStatus;
  build_config: string | null;
  output_url: string | null;
  logs: string[];
  started_at: string;
  completed_at: string | null;
}

export interface PrototypeTestRun {
  id: string;
  prototype_id: string;
  name: string;
  verdict: TestVerdict;
  score: number | null;
  notes: string | null;
  metrics: Record<string, number>;
  created_at: string;
}

export interface PrototypeAiEvaluation {
  riskScore: number;
  recommendation: AiRecommendation;
  improvements: string[];
  failurePoints: string[];
  performanceHints: string[];
  explanation: string;
}

export interface CreatePrototypeInput {
  project_id?: string | null;
  research_id?: string | null;
  name: string;
  description?: string;
  version?: string;
  file?: File;
  thumbnail?: File;
}

/** Core create engine input (camelCase API) */
export interface CreatePrototypeData {
  userId: string;
  name: string;
  description?: string;
  status?: PrototypeLifecycleStatus;
  researchId?: string | null;
  projectId?: string | null;
}

/** Core create engine response */
export interface CreatedPrototype {
  id: string;
  name: string;
  description: string | null;
  status: PrototypeLifecycleStatus;
  researchId: string | null;
  projectId: string | null;
  createdAt: string;
}

export function toCreatedPrototype(record: PrototypeRecord): CreatedPrototype {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.lifecycle_status,
    researchId: record.research_id,
    projectId: record.project_id,
    createdAt: record.created_at,
  };
}

export interface UpdatePrototypeInput {
  name?: string;
  description?: string;
  version?: string;
  project_id?: string;
  lifecycle_status?: PrototypeLifecycleStatus;
  file?: File;
  thumbnail?: File;
}

export const LIFECYCLE_LABELS: Record<PrototypeLifecycleStatus, string> = {
  draft: 'Draft',
  building: 'Building',
  testing: 'Testing',
  success: 'Validated',
  failed: 'Failed',
};

/** Visual pipeline stages for PrototypeLifecycle component */
export type PrototypePipelineStage =
  | 'draft'
  | 'building'
  | 'testing'
  | 'validated'
  | 'promoted';

export const PROTOTYPE_PIPELINE_STAGES: { id: PrototypePipelineStage; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'building', label: 'Building' },
  { id: 'testing', label: 'Testing' },
  { id: 'validated', label: 'Validated' },
  { id: 'promoted', label: 'Promoted' },
];

export function getPrototypePipelineStage(
  prototype: Pick<PrototypeRecord, 'lifecycle_status' | 'project_id'>
): PrototypePipelineStage {
  if (prototype.lifecycle_status === 'success' && prototype.project_id) return 'promoted';
  if (prototype.lifecycle_status === 'success') return 'validated';
  if (prototype.lifecycle_status === 'testing') return 'testing';
  if (prototype.lifecycle_status === 'building') return 'building';
  return 'draft';
}

export interface ResearchLinkSummary {
  projectId: string | null;
  researchProfileId: string | null;
  problemStatement: string | null;
  findingsCount: number;
  documentsCount: number;
  notesCount: number;
}

export interface PromoteToProjectResult {
  projectId: string;
  prototypeId: string;
  promoted: boolean;
}

export function normalizeLifecycleStatus(raw: string | null | undefined): PrototypeLifecycleStatus {
  const map: Record<string, PrototypeLifecycleStatus> = {
    draft: 'draft',
    building: 'building',
    testing: 'testing',
    success: 'success',
    failed: 'failed',
    published: 'success',
    archived: 'failed',
  };
  return map[raw ?? 'draft'] ?? 'draft';
}
