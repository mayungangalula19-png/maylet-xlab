/** Prototype import & ingestion workspace — localStorage until ingestion API ships */

export type IngestionStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'analyzing'
  | 'ready'
  | 'failed';

export type IngestionAssetKind =
  | 'image'
  | 'document'
  | 'media'
  | 'archive'
  | 'code'
  | 'design';

export type IngestionSectionId =
  | 'upload'
  | 'gallery'
  | 'metadata'
  | 'github'
  | 'figma'
  | 'versions'
  | 'readiness'
  | 'activity';

export interface IngestionMetadata {
  name: string;
  description: string;
  category: string;
  industry: string;
  tags: string[];
  projectId: string;
  researchId: string;
}

export interface IngestionAsset {
  id: string;
  name: string;
  kind: IngestionAssetKind;
  mimeType: string;
  size: number;
  url?: string;
  status: IngestionStatus;
  uploadedAt: string;
  prototypeFileId?: string;
}

export interface GitHubImport {
  id: string;
  repoUrl: string;
  readme: string;
  techStack: string[];
  structure: string;
  summary: string;
  status: IngestionStatus;
  createdAt: string;
}

export interface FigmaImport {
  id: string;
  figmaUrl: string;
  frameCount: number;
  screens: string[];
  metadata: string;
  status: IngestionStatus;
  createdAt: string;
}

export interface IngestionVersion {
  id: string;
  label: string;
  notes: string;
  assetCount: number;
  createdAt: string;
}

export interface AiIngestionAnalysis {
  summary: string;
  features: string[];
  technologies: string[];
  suggestedCategories: string[];
  suggestedTags: string[];
  riskIndicators: string[];
  analyzedAt: string | null;
}

export interface IngestionComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface IngestionActivity {
  id: string;
  type: 'upload' | 'import' | 'processing' | 'analysis' | 'version' | 'comment';
  message: string;
  createdAt: string;
}

export interface IngestionAuditEntry {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface PrototypeIngestionWorkspace {
  version: 1;
  metadata: IngestionMetadata;
  assets: IngestionAsset[];
  githubImports: GitHubImport[];
  figmaImports: FigmaImport[];
  versions: IngestionVersion[];
  aiAnalysis: AiIngestionAnalysis;
  comments: IngestionComment[];
  activity: IngestionActivity[];
  owner: string;
  reviewers: string[];
  auditLog: IngestionAuditEntry[];
  updatedAt: string;
}

export const INGESTION_NAV: { id: IngestionSectionId; label: string; icon: string }[] = [
  { id: 'upload', label: 'Upload center', icon: '⬆' },
  { id: 'gallery', label: 'Asset gallery', icon: '🖼' },
  { id: 'metadata', label: 'Metadata', icon: '📝' },
  { id: 'github', label: 'GitHub import', icon: '🐙' },
  { id: 'figma', label: 'Figma import', icon: '🎨' },
  { id: 'versions', label: 'Versions', icon: '📦' },
  { id: 'readiness', label: 'Readiness', icon: '🎯' },
  { id: 'activity', label: 'Activity', icon: '🕐' },
];

export const INGESTION_FORMAT_GROUPS = [
  { label: 'Images', formats: ['PNG', 'JPG', 'JPEG', 'SVG', 'WEBP', 'GIF'] },
  { label: 'Documents', formats: ['PDF', 'DOCX', 'PPTX', 'TXT'] },
  { label: 'Media', formats: ['MP4', 'WEBM'] },
  { label: 'Archives', formats: ['ZIP', 'APK'] },
  { label: 'Code', formats: ['GitHub', 'GitLab'] },
  { label: 'Design', formats: ['Figma'] },
] as const;

export const INGESTION_INDUSTRIES = [
  'Healthcare',
  'Fintech',
  'Education',
  'Climate',
  'Manufacturing',
  'Retail',
  'Enterprise SaaS',
  'Other',
] as const;

export function emptyAiAnalysis(): AiIngestionAnalysis {
  return {
    summary: '',
    features: [],
    technologies: [],
    suggestedCategories: [],
    suggestedTags: [],
    riskIndicators: [],
    analyzedAt: null,
  };
}

export function emptyIngestionWorkspace(partial?: Partial<IngestionMetadata>): PrototypeIngestionWorkspace {
  const now = new Date().toISOString();
  return {
    version: 1,
    metadata: {
      name: partial?.name ?? '',
      description: partial?.description ?? '',
      category: partial?.category ?? 'MVP',
      industry: partial?.industry ?? '',
      tags: partial?.tags ?? [],
      projectId: partial?.projectId ?? '',
      researchId: partial?.researchId ?? '',
    },
    assets: [],
    githubImports: [],
    figmaImports: [],
    versions: [],
    aiAnalysis: emptyAiAnalysis(),
    comments: [],
    activity: [],
    owner: '',
    reviewers: [],
    auditLog: [],
    updatedAt: now,
  };
}

export function newIngestionId(): string {
  return crypto.randomUUID();
}
