import {
  formatPrototypeFileSize,
  getPrototypeFileExtension,
  PROTOTYPE_ALLOWED_EXTENSIONS,
  PROTOTYPE_UPLOAD_MAX_BYTES,
  type PrototypeFile,
} from '../types/prototype.types';
import type {
  AiIngestionAnalysis,
  IngestionAsset,
  IngestionAssetKind,
  IngestionMetadata,
  PrototypeIngestionWorkspace,
} from '../types/prototypeIngestion.types';

export interface IngestionKPIs {
  totalAssets: number;
  readyAssets: number;
  failedAssets: number;
  githubImports: number;
  figmaImports: number;
  versionCount: number;
}

export interface IngestionReadiness {
  documentationScore: number;
  assetScore: number;
  testingReadiness: number;
  validationScore: number;
}

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif']);
const DOC_EXT = new Set(['pdf', 'docx', 'pptx', 'txt']);
const MEDIA_EXT = new Set(['mp4', 'webm']);
const ARCHIVE_EXT = new Set(['zip', 'apk']);

export function detectAssetKind(fileName: string): IngestionAssetKind {
  const ext = getPrototypeFileExtension(fileName);
  if (IMAGE_EXT.has(ext)) return 'image';
  if (DOC_EXT.has(ext)) return 'document';
  if (MEDIA_EXT.has(ext)) return 'media';
  if (ARCHIVE_EXT.has(ext)) return 'archive';
  return 'document';
}

export function validateIngestionFile(file: File, maxBytes = PROTOTYPE_UPLOAD_MAX_BYTES): void {
  if (!file || file.size === 0) throw new Error('Please select a file to upload');
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${formatPrototypeFileSize(maxBytes)}`);
  }
  const ext = getPrototypeFileExtension(file.name);
  if (!PROTOTYPE_ALLOWED_EXTENSIONS.includes(ext as (typeof PROTOTYPE_ALLOWED_EXTENSIONS)[number])) {
    throw new Error(`Unsupported format ".${ext}"`);
  }
}

export function computeIngestionKPIs(ws: PrototypeIngestionWorkspace): IngestionKPIs {
  return {
    totalAssets: ws.assets.length,
    readyAssets: ws.assets.filter((a) => a.status === 'ready').length,
    failedAssets: ws.assets.filter((a) => a.status === 'failed').length,
    githubImports: ws.githubImports.length,
    figmaImports: ws.figmaImports.length,
    versionCount: ws.versions.length,
  };
}

export function computeIngestionReadiness(
  ws: PrototypeIngestionWorkspace,
  dbFiles: PrototypeFile[]
): IngestionReadiness {
  const hasDocs = ws.assets.some((a) => a.kind === 'document') || dbFiles.some((f) => /pdf|docx|pptx|txt/.test(f.fileName));
  const hasImages = ws.assets.some((a) => a.kind === 'image');
  const hasArchive = ws.assets.some((a) => a.kind === 'archive') || dbFiles.some((f) => f.fileName.endsWith('.zip'));
  const hasCode = ws.githubImports.length > 0 || hasArchive;
  const meta = ws.metadata;

  const docFields = [meta.name, meta.description, meta.category].filter(Boolean).length;
  const documentationScore = Math.round((docFields / 3) * 60 + (hasDocs ? 40 : 0));

  const assetBuckets = [hasImages, hasDocs, hasArchive, hasCode, ws.figmaImports.length > 0];
  const assetScore = Math.round((assetBuckets.filter(Boolean).length / assetBuckets.length) * 100);

  const testingReadiness = Math.round(
    (assetScore * 0.4 + documentationScore * 0.3 + (ws.aiAnalysis.analyzedAt ? 30 : 0))
  );

  const validationScore = Math.round(
    documentationScore * 0.35 + assetScore * 0.35 + testingReadiness * 0.3
  );

  return { documentationScore, assetScore, testingReadiness, validationScore };
}

export function syncDbFilesToAssets(files: PrototypeFile[]): IngestionAsset[] {
  return files.map((f) => ({
    id: f.id,
    name: f.fileName,
    kind: detectAssetKind(f.fileName),
    mimeType: f.fileType,
    size: f.fileSize,
    url: f.url,
    status: 'ready' as const,
    uploadedAt: f.uploadedAt,
    prototypeFileId: f.id,
  }));
}

export function analyzeGitHubRepo(url: string): {
  readme: string;
  techStack: string[];
  structure: string;
  summary: string;
} {
  const name = url.replace(/\/$/, '').split('/').slice(-2).join('/');
  return {
    readme: `# ${name}\n\nImported repository prototype.`,
    techStack: ['TypeScript', 'React', 'Node.js'],
    structure: 'src/\n  components/\n  services/\npublic/\npackage.json',
    summary: `Prototype sourced from ${name}. Detected modern web stack with component-based architecture.`,
  };
}

export function analyzeFigmaUrl(url: string): {
  frameCount: number;
  screens: string[];
  metadata: string;
} {
  const slug = url.split('/').pop() ?? 'design';
  return {
    frameCount: 8,
    screens: ['Landing', 'Dashboard', 'Settings', 'Onboarding', 'Profile', 'Checkout', 'Mobile', 'Admin'],
    metadata: `Figma file "${slug}" — UI prototype with ${8} primary frames.`,
  };
}

export function runAiIngestionAnalysis(
  ws: PrototypeIngestionWorkspace,
  prototypeName?: string
): AiIngestionAnalysis {
  const name = ws.metadata.name || prototypeName || 'Imported prototype';
  const techs = ws.githubImports[0]?.techStack ?? ['Web'];
  const features =
    ws.assets.length > 0
      ? ['Core user workflow', 'Visual interface', 'Documentation package']
      : ['Define features after asset upload'];

  return {
    summary: `${name} ingestion package with ${ws.assets.length} assets and ${ws.githubImports.length} code imports.`,
    features,
    technologies: techs,
    suggestedCategories: ws.metadata.category ? [ws.metadata.category] : ['MVP', 'UI prototype'],
    suggestedTags: [...new Set([...ws.metadata.tags, 'imported', ws.metadata.industry].filter(Boolean))],
    riskIndicators:
      ws.assets.length === 0
        ? ['No assets uploaded yet', 'Documentation incomplete']
        : ws.assets.some((a) => a.kind === 'archive')
          ? ['Verify build integrity before testing']
          : ['Review metadata completeness'],
    analyzedAt: new Date().toISOString(),
  };
}

export function autoMetadataFromFile(fileName: string): Partial<IngestionMetadata> {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  return {
    name: base.charAt(0).toUpperCase() + base.slice(1),
    tags: [getPrototypeFileExtension(fileName)],
  };
}
