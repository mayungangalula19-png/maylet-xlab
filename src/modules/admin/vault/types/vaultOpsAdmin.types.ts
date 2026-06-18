export type VaultAssetSource =
  | 'vault_entry'
  | 'vault_item'
  | 'document'
  | 'prototype_file'
  | 'prototype'
  | 'experiment'
  | 'funding_pitch'
  | 'validation'
  | 'ip_record';

export type VaultAssetType =
  | 'research_paper'
  | 'technical_report'
  | 'innovation_idea'
  | 'project_document'
  | 'prototype_file'
  | 'experiment_result'
  | 'validation_report'
  | 'investor_document'
  | 'patent_document'
  | 'market_research'
  | 'commercialization_document'
  | 'image'
  | 'video'
  | 'cad_file'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation'
  | 'source_code'
  | 'strategic_document'
  | 'unknown';

export type VaultClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'strategic'
  | 'ip_protected'
  | 'patent_sensitive';

export type VaultAssetStatus = 'active' | 'archived';

export type VaultPreviewKind =
  | 'pdf'
  | 'image'
  | 'video'
  | 'spreadsheet'
  | 'presentation'
  | 'cad'
  | 'text'
  | 'none';

export type VaultInnovationStage =
  | 'idea'
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization'
  | 'general';

export type VaultRowAction = 'view' | 'preview' | 'archive' | 'export' | 'approve';

export interface VaultFolderNode {
  id: string;
  label: string;
  count: number;
  children?: VaultFolderNode[];
}

export interface AdminVaultOpsStats {
  totalAssets: number;
  activeAssets: number;
  archivedAssets: number;
  confidentialAssets: number;
  patents: number;
  researchDocuments: number;
  prototypesStored: number;
  experimentsStored: number;
  commercialAssets: number;
  knowledgeHealthScore: number;
  trendTotalPct: number;
  trendActivityPct: number;
}

export interface AdminVaultAssetRow {
  id: string;
  sourceKey: string;
  displayId: string;
  title: string;
  source: VaultAssetSource;
  assetType: VaultAssetType;
  classification: VaultClassification;
  status: VaultAssetStatus;
  authorId: string;
  authorName: string;
  authorEmail: string;
  department: string;
  organization: string;
  projectId: string | null;
  projectName: string | null;
  innovationProgram: string | null;
  innovationStage: VaultInnovationStage;
  knowledgeDomain: string;
  collection: string;
  folder: string;
  tags: string[];
  fileUrl: string | null;
  fileType: string | null;
  previewKind: VaultPreviewKind;
  contentPreview: string | null;
  version: number;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  relatedProjectIds: string[];
  relatedAssetKeys: string[];
}

export interface VaultKnowledgeEdge {
  from: string;
  to: string;
  label: string;
}

export interface VaultKnowledgeNode {
  id: string;
  label: string;
  type: VaultAssetSource | 'project' | 'user' | 'organization';
  x?: number;
  y?: number;
}

export interface VaultActivityItem {
  id: string;
  assetKey: string;
  assetTitle: string;
  action: string;
  user?: string;
  at: string;
}

export interface VaultApprovalItem {
  id: string;
  assetKey: string;
  assetTitle: string;
  reviewerRole: string;
  status: string;
  at: string;
}

export interface VaultAnalyticsData {
  knowledgeGrowth: { month: string; count: number }[];
  documentActivity: { month: string; views: number; downloads: number }[];
  assetUtilization: { type: VaultAssetType; count: number }[];
  researchOutput: { department: string; count: number }[];
  portfolioHealth: { band: string; count: number }[];
  classificationDistribution: Record<VaultClassification, number>;
}

export interface VaultOpsMaya {
  bullets: string[];
  patterns: string[];
  anomalies: string[];
  improvements: string[];
  executiveSummary: string;
  duplicateWarnings: string[];
  missingDocumentation: string[];
  relatedRecommendations: string[];
  knowledgeGraphInsights: string[];
  aiConfidence: number;
  priorityAsset: { id: string; title: string } | null;
  priorityAction: string;
}

export interface AdminVaultOpsSnapshot {
  rows: AdminVaultAssetRow[];
  stats: AdminVaultOpsStats;
  folders: VaultFolderNode[];
  collections: { id: string; label: string; count: number }[];
  domains: { id: string; label: string; count: number }[];
  maya: VaultOpsMaya;
  activity: VaultActivityItem[];
  analytics: VaultAnalyticsData;
  platformTotal: number;
  scopeWarning: string | null;
  departments: string[];
  authors: string[];
}

export interface AdminVaultFilters {
  search?: string;
  assetType?: VaultAssetType | 'all';
  classification?: VaultClassification | 'all';
  status?: VaultAssetStatus | 'all';
  department?: string;
  author?: string;
  project?: string;
  innovationStage?: VaultInnovationStage | 'all';
  folder?: string;
  collection?: string;
  domain?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SavedVaultView {
  id: string;
  name: string;
  filters: AdminVaultFilters;
}

export type BulkVaultAction = 'archive' | 'export' | 'request_review';
