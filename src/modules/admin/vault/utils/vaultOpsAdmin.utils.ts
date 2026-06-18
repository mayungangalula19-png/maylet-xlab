import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type {
  AdminVaultAssetRow,
  AdminVaultOpsStats,
  VaultActivityItem,
  VaultAnalyticsData,
  VaultApprovalItem,
  VaultAssetSource,
  VaultAssetStatus,
  VaultAssetType,
  VaultClassification,
  VaultFolderNode,
  VaultInnovationStage,
  VaultKnowledgeEdge,
  VaultKnowledgeNode,
  VaultOpsMaya,
  VaultPreviewKind,
} from '../types/vaultOpsAdmin.types';

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    for (const key of ['message', 'details', 'hint'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return 'Request failed';
}

export function isSchemaError(err: unknown): boolean {
  const msg = extractErrorMessage(err).toLowerCase();
  return (
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('schema cache') ||
    msg.includes('42p01') ||
    msg.includes('42703') ||
    msg.includes('pgrst') ||
    msg.includes('relation')
  );
}

export function schemaMissingError(err: unknown): AdminServiceResult<never> {
  return {
    data: null,
    error: {
      code: 'SCHEMA_MISSING',
      message: `${extractErrorMessage(err)}. Run supabase/migrations/20260617000003_vault_ops_admin.sql in Supabase SQL Editor.`,
    },
  };
}

export function formatVaultDisplayId(source: VaultAssetSource, id: string, createdAt: string): string {
  const prefix: Record<VaultAssetSource, string> = {
    vault_entry: 'VLT',
    vault_item: 'VIT',
    document: 'DOC',
    prototype_file: 'PFI',
    prototype: 'PRT',
    experiment: 'EXP',
    funding_pitch: 'FND',
    validation: 'VAL',
    ip_record: 'IPR',
  };
  const year = new Date(createdAt).getFullYear();
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `${prefix[source]}-${year}-${suffix}`;
}

export function sourceKey(source: VaultAssetSource, id: string): string {
  return `${source}:${id}`;
}

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function inferPreviewKind(
  fileUrl: string | null,
  fileType: string | null,
  title: string
): VaultPreviewKind {
  const name = fileUrl ?? title;
  const ext = extOf(name);
  const type = (fileType ?? '').toLowerCase();
  if (ext === 'pdf' || type.includes('pdf')) return 'pdf';
  if (/^(png|jpg|jpeg|gif|webp|svg)$/.test(ext) || type.startsWith('image')) return 'image';
  if (/^(mp4|webm|mov)$/.test(ext) || type.startsWith('video')) return 'video';
  if (/^(xlsx?|csv)$/.test(ext) || type.includes('spreadsheet')) return 'spreadsheet';
  if (/^(pptx?|key)$/.test(ext) || type.includes('presentation')) return 'presentation';
  if (/^(stl|step|dwg|cad)$/.test(ext)) return 'cad';
  if (fileUrl || type.includes('text')) return 'text';
  return 'none';
}

export function inferAssetType(
  source: VaultAssetSource,
  title: string,
  tags: string[],
  fileType: string | null,
  fileUrl: string | null
): VaultAssetType {
  const hay = `${title} ${tags.join(' ')} ${fileType ?? ''}`.toLowerCase();
  const ext = extOf(fileUrl ?? title);

  if (/patent|ip|trademark|copyright/.test(hay)) return 'patent_document';
  if (/validation|validator/.test(hay) || source === 'validation') return 'validation_report';
  if (/experiment|hypothesis|results/.test(hay) || source === 'experiment') return 'experiment_result';
  if (/pitch|investor|funding|deck/.test(hay) || source === 'funding_pitch') return 'investor_document';
  if (/commercial|gtm|market launch/.test(hay)) return 'commercialization_document';
  if (/market research|market analysis/.test(hay)) return 'market_research';
  if (/research paper|literature|journal/.test(hay)) return 'research_paper';
  if (/technical report|engineering report/.test(hay)) return 'technical_report';
  if (source === 'ip_record') return 'patent_document';
  if (source === 'prototype_file' || source === 'prototype') return 'prototype_file';
  if (source === 'document') return 'project_document';
  if (/idea|concept|brainstorm/.test(hay) || source === 'vault_entry') {
    if (tags.some((t) => /idea/i.test(t))) return 'innovation_idea';
  }
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(`.${ext}`)) return 'image';
  if (/\.(mp4|webm)$/.test(`.${ext}`)) return 'video';
  if (/\.(stl|step|dwg)$/.test(`.${ext}`)) return 'cad_file';
  if (ext === 'pdf') return 'pdf';
  if (/\.(xlsx?|csv)$/.test(`.${ext}`)) return 'spreadsheet';
  if (/\.(pptx?)$/.test(`.${ext}`)) return 'presentation';
  if (/\.(js|ts|py|java|go|rs)$/.test(`.${ext}`)) return 'source_code';
  if (/strategy|strategic|roadmap/.test(hay)) return 'strategic_document';
  if (source === 'vault_item') return 'innovation_idea';
  return 'unknown';
}

export function inferClassification(
  isConfidential: boolean,
  isPublic: boolean,
  tags: string[],
  assetType: VaultAssetType
): VaultClassification {
  const tagHay = tags.join(' ').toLowerCase();
  if (/patent.?sensitive|patent pending/.test(tagHay) || assetType === 'patent_document') {
    return 'patent_sensitive';
  }
  if (/ip protected|intellectual property/.test(tagHay)) {
    return 'ip_protected';
  }
  if (/strategic|executive|board/.test(tagHay) || assetType === 'strategic_document') {
    return 'strategic';
  }
  if (/restricted|classified|secret/.test(tagHay)) return 'restricted';
  if (isConfidential) return 'confidential';
  if (isPublic) return 'public';
  return 'internal';
}

export function inferInnovationStage(
  source: VaultAssetSource,
  assetType: VaultAssetType,
  tags: string[]
): VaultInnovationStage {
  const hay = `${source} ${assetType} ${tags.join(' ')}`.toLowerCase();
  if (/commercial|gtm|launch/.test(hay)) return 'commercialization';
  if (/funding|investor|pitch/.test(hay) || source === 'funding_pitch') return 'funding';
  if (/validation/.test(hay) || source === 'validation') return 'validation';
  if (/experiment/.test(hay) || source === 'experiment') return 'experiment';
  if (/prototype/.test(hay) || source === 'prototype' || source === 'prototype_file') return 'prototype';
  if (/research|paper|literature/.test(hay) || assetType === 'research_paper') return 'research';
  if (/idea|concept/.test(hay)) return 'idea';
  return 'general';
}

export function inferKnowledgeDomain(
  department: string,
  assetType: VaultAssetType,
  tags: string[]
): string {
  const tag = tags.find((t) => /domain:|sector:/i.test(t));
  if (tag) return tag.split(':')[1]?.trim() ?? department;
  if (assetType === 'patent_document') return 'Intellectual Property';
  if (assetType === 'research_paper') return 'Research & Discovery';
  if (assetType === 'experiment_result') return 'Experimentation';
  if (assetType === 'validation_report') return 'Validation';
  if (assetType === 'investor_document') return 'Funding & Investment';
  if (assetType === 'commercialization_document') return 'Commercialization';
  if (assetType === 'prototype_file') return 'Engineering & Prototypes';
  return department || 'General Knowledge';
}

export function inferFolder(source: VaultAssetSource, assetType: VaultAssetType): string {
  const map: Partial<Record<VaultAssetType, string>> = {
    research_paper: 'Research',
    technical_report: 'Research',
    innovation_idea: 'Ideas',
    project_document: 'Projects',
    prototype_file: 'Prototypes',
    experiment_result: 'Experiments',
    validation_report: 'Validation',
    investor_document: 'Funding',
    patent_document: 'Intellectual Property',
    market_research: 'Commercialization',
    commercialization_document: 'Commercialization',
    strategic_document: 'Strategic',
  };
  if (map[assetType]) return map[assetType]!;
  const sourceMap: Record<VaultAssetSource, string> = {
    vault_entry: 'Vault Entries',
    vault_item: 'Legacy Items',
    document: 'Project Documents',
    prototype_file: 'Prototypes',
    prototype: 'Prototypes',
    experiment: 'Experiments',
    funding_pitch: 'Funding',
    validation: 'Validation',
    ip_record: 'Intellectual Property',
  };
  return sourceMap[source] ?? 'General';
}

export function inferCollection(assetType: VaultAssetType, innovationStage: VaultInnovationStage): string {
  if (innovationStage !== 'general') {
    return innovationStage.charAt(0).toUpperCase() + innovationStage.slice(1);
  }
  if (assetType === 'patent_document') return 'IP Portfolio';
  if (assetType === 'investor_document') return 'Investor Relations';
  return 'Core Knowledge';
}

export interface RawVaultInput {
  id: string;
  source: VaultAssetSource;
  title: string;
  userId: string;
  projectId?: string | null;
  description?: string | null;
  content?: string | null;
  tags?: string[];
  isConfidential?: boolean;
  isPublic?: boolean;
  fileUrl?: string | null;
  fileType?: string | null;
  version?: number;
  sizeBytes?: number | null;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export function buildVaultAssetRow(
  raw: RawVaultInput,
  owner: { name: string; email: string },
  project: { name?: string; sector?: string } | null,
  program: string | null
): AdminVaultAssetRow {
  const tags = raw.tags ?? [];
  const assetType = inferAssetType(raw.source, raw.title, tags, raw.fileType ?? null, raw.fileUrl ?? null);
  const classification = inferClassification(
    raw.isConfidential ?? true,
    raw.isPublic ?? false,
    tags,
    assetType
  );
  const innovationStage = inferInnovationStage(raw.source, assetType, tags);
  const department = project?.sector?.trim() || 'General Innovation';
  const knowledgeDomain = inferKnowledgeDomain(department, assetType, tags);
  const folder = inferFolder(raw.source, assetType);
  const collection = inferCollection(assetType, innovationStage);
  const status: VaultAssetStatus =
    raw.status === 'archived' || raw.status === 'deleted' ? 'archived' : 'active';

  const contentPreview = (raw.content ?? raw.description ?? '').slice(0, 280) || null;

  return {
    id: raw.id,
    sourceKey: sourceKey(raw.source, raw.id),
    displayId: formatVaultDisplayId(raw.source, raw.id, raw.createdAt),
    title: raw.title,
    source: raw.source,
    assetType,
    classification,
    status,
    authorId: raw.userId,
    authorName: owner.name,
    authorEmail: owner.email,
    department,
    organization: 'Maylet X Lab',
    projectId: raw.projectId ?? null,
    projectName: project?.name ?? null,
    innovationProgram: program,
    innovationStage,
    knowledgeDomain,
    collection,
    folder,
    tags,
    fileUrl: raw.fileUrl ?? null,
    fileType: raw.fileType ?? null,
    previewKind: inferPreviewKind(raw.fileUrl ?? null, raw.fileType ?? null, raw.title),
    contentPreview,
    version: raw.version ?? 1,
    sizeBytes: raw.sizeBytes ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastActivity: raw.updatedAt,
    relatedProjectIds: raw.projectId ? [raw.projectId] : [],
    relatedAssetKeys: [],
  };
}

export function linkRelatedAssets(rows: AdminVaultAssetRow[]): AdminVaultAssetRow[] {
  const byProject = new Map<string, AdminVaultAssetRow[]>();
  for (const row of rows) {
    if (!row.projectId) continue;
    const list = byProject.get(row.projectId) ?? [];
    list.push(row);
    byProject.set(row.projectId, list);
  }

  return rows.map((row) => {
    if (!row.projectId) return row;
    const siblings = byProject.get(row.projectId) ?? [];
    const relatedAssetKeys = siblings
      .filter((s) => s.sourceKey !== row.sourceKey)
      .slice(0, 8)
      .map((s) => s.sourceKey);
    return { ...row, relatedAssetKeys };
  });
}

export function buildAdminVaultStats(rows: AdminVaultAssetRow[]): AdminVaultOpsStats {
  const totalAssets = rows.length;
  const activeAssets = rows.filter((r) => r.status === 'active').length;
  const archivedAssets = rows.filter((r) => r.status === 'archived').length;
  const confidentialAssets = rows.filter((r) =>
    ['confidential', 'restricted', 'strategic', 'ip_protected', 'patent_sensitive'].includes(
      r.classification
    )
  ).length;
  const patents = rows.filter(
    (r) => r.assetType === 'patent_document' || r.classification === 'patent_sensitive'
  ).length;
  const researchDocuments = rows.filter((r) =>
    ['research_paper', 'technical_report'].includes(r.assetType)
  ).length;
  const prototypesStored = rows.filter(
    (r) => r.source === 'prototype' || r.source === 'prototype_file' || r.assetType === 'prototype_file'
  ).length;
  const experimentsStored = rows.filter(
    (r) => r.source === 'experiment' || r.assetType === 'experiment_result'
  ).length;
  const commercialAssets = rows.filter(
    (r) =>
      r.innovationStage === 'commercialization' ||
      ['commercialization_document', 'market_research', 'investor_document'].includes(r.assetType)
  ).length;

  const knowledgeHealthScore =
    totalAssets === 0
      ? 0
      : Math.round(
          rows.reduce((s, r) => {
            let score = 50;
            if (r.tags.length > 0) score += 10;
            if (r.contentPreview || r.fileUrl) score += 15;
            if (r.projectId) score += 10;
            score += 5;
            if (r.version > 1) score += 10;
            return s + Math.min(100, score);
          }, 0) /
            totalAssets /
            10
        );

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const recent = rows.filter((r) => new Date(r.createdAt).getTime() > thirtyDaysAgo).length;
  const prior = rows.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t > sixtyDaysAgo && t <= thirtyDaysAgo;
  }).length;
  const trendTotalPct =
    prior > 0 ? Math.round(((recent - prior) / prior) * 100) : recent > 0 ? 100 : 0;

  const recentActivity = rows.filter((r) => new Date(r.updatedAt).getTime() > thirtyDaysAgo).length;
  const priorActivity = rows.filter((r) => {
    const t = new Date(r.updatedAt).getTime();
    return t > sixtyDaysAgo && t <= thirtyDaysAgo;
  }).length;
  const trendActivityPct =
    priorActivity > 0
      ? Math.round(((recentActivity - priorActivity) / priorActivity) * 100)
      : recentActivity > 0
        ? 100
        : 0;

  return {
    totalAssets,
    activeAssets,
    archivedAssets,
    confidentialAssets,
    patents,
    researchDocuments,
    prototypesStored,
    experimentsStored,
    commercialAssets,
    knowledgeHealthScore,
    trendTotalPct,
    trendActivityPct,
  };
}

export function buildFolderTree(rows: AdminVaultAssetRow[]): VaultFolderNode[] {
  const folderMap = new Map<string, number>();
  for (const row of rows) {
    folderMap.set(row.folder, (folderMap.get(row.folder) ?? 0) + 1);
  }
  return [...folderMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ id: label.toLowerCase().replace(/\s+/g, '-'), label, count }));
}

export function buildCollections(rows: AdminVaultAssetRow[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.collection, (map.get(row.collection) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      count,
    }));
}

export function buildDomains(rows: AdminVaultAssetRow[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.knowledgeDomain, (map.get(row.knowledgeDomain) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      count,
    }));
}

export function buildPortfolioMaya(rows: AdminVaultAssetRow[]): VaultOpsMaya {
  const withoutProject = rows.filter((r) => !r.projectId && r.status === 'active');
  const withoutTags = rows.filter((r) => r.tags.length === 0);
  const duplicates = findDuplicateTitles(rows);
  const stale = rows.filter((r) => {
    const days = (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 90 && r.status === 'active';
  });

  const avgHealth =
    rows.length === 0
      ? 0
      : Math.round(
          rows.reduce((s, r) => {
            let h = 40;
            if (r.tags.length) h += 15;
            if (r.fileUrl || r.contentPreview) h += 20;
            if (r.projectId) h += 15;
            if (r.version > 1) h += 10;
            return s + h;
          }, 0) / rows.length
        );

  const priority =
    [...withoutProject, ...withoutTags].sort(
      (a, b) =>
        (a.classification === 'patent_sensitive' ? 10 : 0) -
        (b.classification === 'patent_sensitive' ? 10 : 0)
    )[0] ?? null;

  return {
    bullets: [
      `${rows.length} knowledge assets under governance`,
      `${avgHealth}% average documentation completeness`,
      `${duplicates.length} potential duplicate clusters detected`,
    ],
    patterns: [
      rows.filter((r) => r.classification === 'confidential').length >
      rows.length * 0.5
        ? 'High confidential asset ratio — verify access policies'
        : 'Classification distribution within normal bounds',
      rows.filter((r) => r.innovationStage === 'research').length > 0
        ? 'Strong research knowledge base'
        : 'Research documentation gap detected',
    ],
    anomalies: [
      withoutProject.length > 0
        ? `${withoutProject.length} assets not linked to projects`
        : '',
      stale.length > 0 ? `${stale.length} assets inactive >90 days` : '',
    ].filter(Boolean),
    improvements: [
      withoutTags.length > 0
        ? `Tag ${withoutTags.length} untagged assets for discoverability`
        : 'Maintain tagging standards',
      withoutProject.length > 0
        ? 'Link orphan assets to innovation programs'
        : 'Project linkage healthy',
    ],
    executiveSummary: `Innovation Vault portfolio: ${rows.length} assets, ${avgHealth}% knowledge completeness. ${confidentialCount(rows)} confidential/restricted items under protection. ${duplicates.length} duplicate clusters flagged for review.`,
    duplicateWarnings: duplicates.slice(0, 5),
    missingDocumentation: withoutProject.slice(0, 5).map((r) => `"${r.title}" — no project link`),
    relatedRecommendations: priority
      ? [`Review "${priority.title}" — enrich metadata and project linkage`]
      : [],
    knowledgeGraphInsights: [
      `${new Set(rows.flatMap((r) => r.relatedProjectIds)).size} innovation programs connected`,
      `${rows.filter((r) => r.relatedAssetKeys.length > 0).length} assets with cross-links`,
    ],
    aiConfidence: Math.min(100, Math.round(avgHealth * 0.85 + (rows.length > 0 ? 15 : 0))),
    priorityAsset: priority ? { id: priority.sourceKey, title: priority.title } : null,
    priorityAction: priority
      ? `Enrich "${priority.title}" — add tags, project link, classification review`
      : 'Vault operating within governance parameters',
  };
}

function confidentialCount(rows: AdminVaultAssetRow[]): number {
  return rows.filter((r) =>
    ['confidential', 'restricted', 'strategic', 'ip_protected', 'patent_sensitive'].includes(
      r.classification
    )
  ).length;
}

function findDuplicateTitles(rows: AdminVaultAssetRow[]): string[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = row.title.trim().toLowerCase();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].filter(([, c]) => c > 1).map(([title]) => `"${title}" (${map.get(title)} copies)`);
}

export function buildVaultAnalytics(rows: AdminVaultAssetRow[]): VaultAnalyticsData {
  const monthKey = (iso: string) => iso.slice(0, 7);
  const months = [...new Set(rows.map((r) => monthKey(r.createdAt)))].sort().slice(-6);

  const knowledgeGrowth = months.map((month) => ({
    month,
    count: rows.filter((r) => monthKey(r.createdAt) === month).length,
  }));

  const documentActivity = months.map((month) => ({
    month,
    views: rows.filter((r) => monthKey(r.updatedAt) === month).length * 3,
    downloads: rows.filter((r) => monthKey(r.updatedAt) === month && r.fileUrl).length,
  }));

  const typeMap = new Map<VaultAssetType, number>();
  for (const row of rows) {
    typeMap.set(row.assetType, (typeMap.get(row.assetType) ?? 0) + 1);
  }
  const assetUtilization = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const deptMap = new Map<string, number>();
  for (const row of rows) {
    if (row.assetType === 'research_paper' || row.assetType === 'technical_report') {
      deptMap.set(row.department, (deptMap.get(row.department) ?? 0) + 1);
    }
  }
  const researchOutput = [...deptMap.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  const bands = ['0-39', '40-59', '60-79', '80-100'];
  const portfolioHealth = bands.map((band) => {
    const [lo, hi] = band.split('-').map(Number);
    return {
      band,
      count: rows.filter((r) => {
        let score = 40;
        if (r.tags.length) score += 15;
        if (r.fileUrl || r.contentPreview) score += 25;
        if (r.projectId) score += 20;
        return score >= lo && score <= hi;
      }).length,
    };
  });

  const classificationDistribution = {
    public: rows.filter((r) => r.classification === 'public').length,
    internal: rows.filter((r) => r.classification === 'internal').length,
    confidential: rows.filter((r) => r.classification === 'confidential').length,
    restricted: rows.filter((r) => r.classification === 'restricted').length,
    strategic: rows.filter((r) => r.classification === 'strategic').length,
    ip_protected: rows.filter((r) => r.classification === 'ip_protected').length,
    patent_sensitive: rows.filter((r) => r.classification === 'patent_sensitive').length,
  };

  return {
    knowledgeGrowth,
    documentActivity,
    assetUtilization,
    researchOutput,
    portfolioHealth,
    classificationDistribution,
  };
}

export function extractVaultActivity(rows: AdminVaultAssetRow[]): VaultActivityItem[] {
  return rows
    .flatMap((row) => [
      {
        id: `${row.sourceKey}-updated`,
        assetKey: row.sourceKey,
        assetTitle: row.title,
        action: 'Updated asset',
        user: row.authorName,
        at: row.updatedAt,
      },
      {
        id: `${row.sourceKey}-created`,
        assetKey: row.sourceKey,
        assetTitle: row.title,
        action: 'Created asset',
        user: row.authorName,
        at: row.createdAt,
      },
    ])
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
}

export function extractApprovalItems(rows: AdminVaultAssetRow[]): VaultApprovalItem[] {
  return rows
    .filter(
      (r) =>
        r.status === 'active' &&
        ['restricted', 'strategic', 'ip_protected', 'patent_sensitive'].includes(r.classification)
    )
    .slice(0, 8)
    .map((r, idx) => ({
      id: `approval-${idx}-${r.sourceKey}`,
      assetKey: r.sourceKey,
      assetTitle: r.title,
      reviewerRole: 'admin',
      status: 'pending',
      at: r.updatedAt,
    }));
}

export function buildKnowledgeGraph(
  selected: AdminVaultAssetRow | null,
  rows: AdminVaultAssetRow[]
): { nodes: VaultKnowledgeNode[]; edges: VaultKnowledgeEdge[] } {
  if (!selected) return { nodes: [], edges: [] };

  const nodes: VaultKnowledgeNode[] = [
    { id: selected.sourceKey, label: selected.title, type: selected.source },
  ];
  const edges: VaultKnowledgeEdge[] = [];

  if (selected.projectId) {
    nodes.push({
      id: `project:${selected.projectId}`,
      label: selected.projectName ?? 'Project',
      type: 'project',
    });
    edges.push({
      from: selected.sourceKey,
      to: `project:${selected.projectId}`,
      label: 'belongs to',
    });
  }

  nodes.push({
    id: `user:${selected.authorId}`,
    label: selected.authorName,
    type: 'user',
  });
  edges.push({ from: selected.sourceKey, to: `user:${selected.authorId}`, label: 'authored by' });

  const related = rows.filter((r) => selected.relatedAssetKeys.includes(r.sourceKey));
  for (const rel of related.slice(0, 6)) {
    nodes.push({ id: rel.sourceKey, label: rel.title.slice(0, 24), type: rel.source });
    edges.push({ from: selected.sourceKey, to: rel.sourceKey, label: 'related' });
  }

  const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);
  nodes.forEach((n, i) => {
    if (n.id === selected.sourceKey) {
      n.x = 50;
      n.y = 50;
    } else {
      n.x = 50 + 35 * Math.cos(i * angleStep);
      n.y = 50 + 35 * Math.sin(i * angleStep);
    }
  });

  return { nodes, edges };
}

export function classificationVariant(
  c: VaultClassification
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (c === 'public') return 'success';
  if (c === 'internal') return 'info';
  if (c === 'confidential') return 'warning';
  if (['restricted', 'strategic', 'ip_protected', 'patent_sensitive'].includes(c)) return 'danger';
  return 'default';
}

export function exportVaultCsv(rows: AdminVaultAssetRow[]): string {
  const headers = [
    'Asset ID',
    'Title',
    'Type',
    'Source',
    'Classification',
    'Status',
    'Author',
    'Department',
    'Project',
    'Stage',
    'Domain',
    'Folder',
    'Tags',
    'Created',
    'Updated',
  ];
  const lines = rows.map((r) =>
    [
      r.displayId,
      `"${r.title.replace(/"/g, '""')}"`,
      r.assetType,
      r.source,
      r.classification,
      r.status,
      `"${r.authorName.replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${(r.projectName ?? '').replace(/"/g, '""')}"`,
      r.innovationStage,
      `"${r.knowledgeDomain.replace(/"/g, '""')}"`,
      r.folder,
      `"${r.tags.join('; ')}"`,
      r.createdAt,
      r.updatedAt,
    ].join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

export const SAVED_VIEWS_KEY = 'maylet-admin-vault-views';

export function loadSavedVaultViews(): import('../types/vaultOpsAdmin.types').SavedVaultView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    if (raw) return JSON.parse(raw) as import('../types/vaultOpsAdmin.types').SavedVaultView[];
  } catch {
    /* ignore */
  }
  return [];
}

export function persistSavedVaultViews(
  views: import('../types/vaultOpsAdmin.types').SavedVaultView[]
): void {
  localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
}

export const ASSET_TYPE_OPTIONS: { id: VaultAssetType | 'all'; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'research_paper', label: 'Research Papers' },
  { id: 'technical_report', label: 'Technical Reports' },
  { id: 'innovation_idea', label: 'Innovation Ideas' },
  { id: 'project_document', label: 'Project Documents' },
  { id: 'prototype_file', label: 'Prototype Files' },
  { id: 'experiment_result', label: 'Experiment Results' },
  { id: 'validation_report', label: 'Validation Reports' },
  { id: 'investor_document', label: 'Investor Documents' },
  { id: 'patent_document', label: 'Patent Documents' },
  { id: 'commercialization_document', label: 'Commercialization' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Videos' },
  { id: 'cad_file', label: 'CAD Files' },
];

export const CLASSIFICATION_OPTIONS: { id: VaultClassification | 'all'; label: string }[] = [
  { id: 'all', label: 'All classifications' },
  { id: 'public', label: 'Public' },
  { id: 'internal', label: 'Internal' },
  { id: 'confidential', label: 'Confidential' },
  { id: 'restricted', label: 'Restricted' },
  { id: 'strategic', label: 'Strategic' },
  { id: 'ip_protected', label: 'IP Protected' },
  { id: 'patent_sensitive', label: 'Patent Sensitive' },
];
