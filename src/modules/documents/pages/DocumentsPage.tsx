import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { uploadProjectDocumentFile } from '../../../lib/supabase/document.queries';
import { useAuth } from '../../../hooks/useAuth';
import { getProjects } from '../../../lib/supabase/projects.queries';
import type { ResearchDocument } from '../../../modules/research/types/research.types';
import type { Project } from '../../../types/project.types';

/* ─── Types & constants ───────────────────────────────────────────────────── */

const PIPELINE = [
  'Idea',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
  'Commercialization',
] as const;

const LIFECYCLE_MODULES = [
  'project',
  'research',
  'prototype',
  'experiment',
  'validation',
  'funding',
  'commercialization',
] as const;

type LifecycleModule = (typeof LIFECYCLE_MODULES)[number];

const MODULE_LABELS: Record<LifecycleModule, string> = {
  project: 'Project',
  research: 'Research',
  prototype: 'Prototype',
  experiment: 'Experiment',
  validation: 'Validation',
  funding: 'Funding',
  commercialization: 'Commercialization',
};

const MODULE_ROUTES: Record<LifecycleModule, (projectId: string) => string> = {
  project: (id) => `/projects/${id}`,
  research: (id) => `/research/${id}/documents`,
  prototype: (id) => `/prototypes?projectId=${id}`,
  experiment: (id) => `/experiments?projectId=${id}`,
  validation: (id) => `/validation/new?projectId=${id}`,
  funding: (id) => `/funding/create?projectId=${id}`,
  commercialization: (id) => `/commercialization?projectId=${id}`,
};

const FILE_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'txt', label: 'TXT' },
  { value: 'csv', label: 'CSV' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'zip', label: 'ZIP' },
] as const;

const ALLOWED_EXT = /\.(pdf|docx|pptx|xlsx|txt|csv|png|jpe?g|zip)$/i;

type FileKind = (typeof FILE_TYPES)[number]['value'];

interface AuthorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface EnterpriseDocument extends ResearchDocument {
  project_name: string;
  project_sector: string;
  author_name: string;
  module: LifecycleModule;
  version: string;
  archived: boolean;
  file_kind: FileKind | 'other';
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface MayaDocInsight {
  summary: string;
  keyFindings: string[];
  insights: string[];
  importantFlags: string[];
  relatedIds: string[];
  nextActions: string[];
}

interface DashboardMetrics {
  total: number;
  research: number;
  prototype: number;
  experiment: number;
  validation: number;
  funding: number;
  commercialization: number;
  project: number;
  storageBytes: number;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function isLifecycleModule(v: string): v is LifecycleModule {
  return (LIFECYCLE_MODULES as readonly string[]).includes(v);
}

function tagValue(tags: string[] | null | undefined, prefix: string): string | null {
  const hit = (tags ?? []).find((t) => t.startsWith(`${prefix}:`));
  return hit ? hit.slice(prefix.length + 1) : null;
}

function resolveModule(category: string | null, tags: string[] | null): LifecycleModule {
  const fromTag = tagValue(tags, 'module');
  if (fromTag && isLifecycleModule(fromTag)) return fromTag;

  const cat = (category ?? '').toLowerCase();
  const map: Record<string, LifecycleModule> = {
    research: 'research',
    evidence: 'research',
    interview: 'research',
    prototype: 'prototype',
    experiment: 'experiment',
    validation: 'validation',
    pitch: 'funding',
    financial: 'funding',
    legal: 'commercialization',
    commercialization: 'commercialization',
    general: 'project',
    other: 'project',
  };
  return map[cat] ?? 'project';
}

function resolveVersion(tags: string[] | null): string {
  return tagValue(tags, 'version') ?? '1.0';
}

function isArchived(tags: string[] | null): boolean {
  return (tags ?? []).includes('archived');
}

function fileKindFromDoc(name: string, mime: string | null): FileKind | 'other' {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf') || mime?.includes('pdf')) return 'pdf';
  if (n.endsWith('.docx') || mime?.includes('word')) return 'docx';
  if (n.endsWith('.pptx') || mime?.includes('presentation')) return 'pptx';
  if (n.endsWith('.xlsx') || mime?.includes('spreadsheet')) return 'xlsx';
  if (n.endsWith('.txt') || mime?.includes('text/plain')) return 'txt';
  if (n.endsWith('.csv') || mime?.includes('csv')) return 'csv';
  if (n.endsWith('.png') || mime?.includes('png')) return 'png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg') || mime?.includes('jpeg')) return 'jpg';
  if (n.endsWith('.zip') || mime?.includes('zip')) return 'zip';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function validateFile(file: File): string | null {
  if (ALLOWED_EXT.test(file.name)) return null;
  return 'Supported: PDF, DOCX, PPTX, XLSX, TXT, CSV, PNG, JPG, ZIP';
}

function buildTags(
  module: LifecycleModule,
  version: string,
  extra: string,
  archived = false
): string[] {
  const tags = [
    `module:${module}`,
    `version:${version}`,
    ...extra
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean),
  ];
  if (archived) tags.push('archived');
  return [...new Set(tags)];
}

function matchesSearch(doc: EnterpriseDocument, q: string, authorQ: string): boolean {
  const hay = [
    doc.name,
    doc.project_name,
    doc.author_name,
    doc.category ?? '',
    doc.description ?? '',
    doc.module,
    ...(doc.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  if (q && !hay.includes(q)) return false;
  if (authorQ && !doc.author_name.toLowerCase().includes(authorQ)) return false;
  return true;
}

/* ─── MAYA document intelligence (client stubs) ───────────────────────────── */

function mayaSummarize(doc: EnterpriseDocument): string {
  return `${doc.name} supports the ${MODULE_LABELS[doc.module]} phase for ${doc.project_name}. ${
    doc.description?.trim() ||
    `This ${doc.file_kind.toUpperCase()} artifact should be referenced during ${doc.module === 'validation' ? 'gate review' : 'pipeline reviews'}.`
  }`;
}

function mayaKeyFindings(doc: EnterpriseDocument): string[] {
  const base = [
    `Linked to ${doc.project_name} (${doc.project_sector}) in the ${MODULE_LABELS[doc.module]} module.`,
    `Version ${doc.version} uploaded ${new Date(doc.created_at).toLocaleDateString()}.`,
  ];
  if (doc.module === 'research') base.push('Supports problem evidence and literature traceability.');
  if (doc.module === 'validation') base.push('Eligible as validation gate supporting material.');
  if (doc.module === 'funding') base.push('May be cited in investor diligence and pitch workflows.');
  return base;
}

function mayaInsights(doc: EnterpriseDocument, all: EnterpriseDocument[]): string[] {
  const sameProject = all.filter((d) => d.project_id === doc.project_id && d.id !== doc.id).length;
  return [
    `${sameProject} related file(s) exist for this project.`,
    doc.archived ? 'Document is archived — restore before external sharing.' : 'Active document — suitable for workspace linking.',
    `Storage footprint: ${formatBytes(doc.size_bytes ?? 0)}.`,
  ];
}

function mayaImportantFlags(doc: EnterpriseDocument): string[] {
  const flags: string[] = [];
  if (!doc.file_url) flags.push('Missing file URL — re-upload required.');
  if (doc.module === 'funding' && doc.file_kind === 'pdf') flags.push('Investor-facing PDF — ensure version matches live pitch.');
  if (doc.module === 'validation' && !doc.description) flags.push('Add description for auditor context.');
  if (flags.length === 0) flags.push('No critical issues detected.');
  return flags;
}

function mayaRelated(doc: EnterpriseDocument, all: EnterpriseDocument[]): string[] {
  return all
    .filter(
      (d) =>
        d.id !== doc.id &&
        (d.project_id === doc.project_id || d.module === doc.module) &&
        (d.tags ?? []).some((t) => (doc.tags ?? []).includes(t))
    )
    .slice(0, 4)
    .map((d) => d.id);
}

function mayaNextActions(doc: EnterpriseDocument): string[] {
  const routes: Record<LifecycleModule, string> = {
    project: 'Open project detail and link tasks.',
    research: 'Attach to research workspace findings.',
    prototype: 'Reference in prototype build notes.',
    experiment: 'Cite in experiment results.',
    validation: 'Include in validation gate reviewer notes.',
    funding: 'Attach to funding pitch workspace.',
    commercialization: 'Add to GTM launch packet.',
  };
  return [
    routes[doc.module],
    'Tag collaborators and set version before investor share.',
    doc.module === 'validation' ? 'Run validation gate when evidence set is complete.' : 'Advance to next pipeline stage when ready.',
  ];
}

function buildMayaInsight(doc: EnterpriseDocument, all: EnterpriseDocument[]): MayaDocInsight {
  return {
    summary: mayaSummarize(doc),
    keyFindings: mayaKeyFindings(doc),
    insights: mayaInsights(doc, all),
    importantFlags: mayaImportantFlags(doc),
    relatedIds: mayaRelated(doc, all),
    nextActions: mayaNextActions(doc),
  };
}

async function uploadEnterpriseDocument(
  projectId: string,
  userId: string,
  file: File,
  meta: { module: LifecycleModule; version: string; tags: string; description: string }
): Promise<ResearchDocument> {
  const err = validateFile(file);
  if (err) throw new Error(err);

  const tagList = buildTags(meta.module, meta.version, meta.tags);

  return uploadProjectDocumentFile(projectId, userId, file, {
    category: meta.module,
    tags: tagList,
    description: meta.description.trim() || undefined,
  });
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function Documents() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProjectId = searchParams.get('projectId') ?? searchParams.get('project') ?? '';

  const fileRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<EnterpriseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [filterProject, setFilterProject] = useState(prefillProjectId);
  const [filterModule, setFilterModule] = useState<LifecycleModule | 'all'>('all');
  const [filterType, setFilterType] = useState<FileKind>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const [uploadProjectId, setUploadProjectId] = useState(prefillProjectId);
  const [uploadModule, setUploadModule] = useState<LifecycleModule>('research');
  const [uploadVersion, setUploadVersion] = useState('1.0');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<EnterpriseDocument | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mayaInsight, setMayaInsight] = useState<MayaDocInsight | null>(null);
  const [mayaDocId, setMayaDocId] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const enrichRows = useCallback(
    (rows: ResearchDocument[], projectList: Project[], authors: Map<string, string>) => {
      const nameById = new Map(projectList.map((p) => [p.id, p.name]));
      const sectorById = new Map(projectList.map((p) => [p.id, p.sector]));

      return rows.map((d) => {
        const tags = d.tags ?? [];
        return {
          ...d,
          project_name: nameById.get(d.project_id) ?? 'Unknown project',
          project_sector: sectorById.get(d.project_id) ?? '—',
          author_name: authors.get(d.user_id) ?? 'Team member',
          module: resolveModule(d.category, tags),
          version: resolveVersion(tags),
          archived: isArchived(tags),
          file_kind: fileKindFromDoc(d.name, d.file_type),
        } satisfies EnterpriseDocument;
      });
    },
    []
  );

  const loadData = useCallback(
    async (userId: string) => {
      const projectList = await getProjects(userId);
      const { data: docRows, error: docErr } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (docErr) throw docErr;

      const authorIds = [...new Set((docRows ?? []).map((d) => String(d.user_id)))];
      const authorMap = new Map<string, string>();

      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', authorIds);

        for (const p of (profiles ?? []) as AuthorProfile[]) {
          authorMap.set(p.id, p.full_name || p.email?.split('@')[0] || 'Team member');
        }
      }
      authorMap.set(userId, authorMap.get(userId) ?? 'You');

      setProjects(projectList);
      setDocuments(enrichRows((docRows ?? []) as ResearchDocument[], projectList, authorMap));
    },
    [enrichRows]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await loadData(user.id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load document center');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate, loadData]);

  useEffect(() => {
    if (prefillProjectId) {
      setFilterProject(prefillProjectId);
      setUploadProjectId(prefillProjectId);
    }
  }, [prefillProjectId]);

  const metrics: DashboardMetrics = useMemo(() => {
    const m: DashboardMetrics = {
      total: documents.length,
      research: 0,
      prototype: 0,
      experiment: 0,
      validation: 0,
      funding: 0,
      commercialization: 0,
      project: 0,
      storageBytes: 0,
    };
    for (const d of documents) {
      m[d.module] += 1;
      m.storageBytes += d.size_bytes ?? 0;
    }
    return m;
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const aq = authorSearch.trim().toLowerCase();

    let list = documents.filter((d) => {
      if (!showArchived && d.archived) return false;
      if (filterProject && d.project_id !== filterProject) return false;
      if (filterModule !== 'all' && d.module !== filterModule) return false;
      if (filterType !== 'all' && d.file_kind !== filterType) return false;
      return matchesSearch(d, q, aq);
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const ta = new Date(a.updated_at ?? a.created_at).getTime();
      const tb = new Date(b.updated_at ?? b.created_at).getTime();
      return sortBy === 'newest' ? tb - ta : ta - tb;
    });

    return list;
  }, [
    documents,
    search,
    authorSearch,
    filterProject,
    filterModule,
    filterType,
    showArchived,
    sortBy,
  ]);

  const processUploadQueue = async (files: File[]) => {
    if (!user || !uploadProjectId) {
      setError('Select a target project before uploading.');
      return;
    }

    const items: UploadQueueItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      progress: 0,
      status: 'queued' as const,
    }));
    setUploadQueue((prev) => [...items, ...prev]);
    setError(null);

    for (const item of items) {
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 15 } : q))
      );

      try {
        const err = validateFile(item.file);
        if (err) throw new Error(err);

        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: 45 } : q))
        );

        await uploadEnterpriseDocument(uploadProjectId, user.id, item.file, {
          module: uploadModule,
          version: uploadVersion,
          tags: uploadTags,
          description: uploadDescription,
        });

        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done', progress: 100 } : q))
        );
      } catch (err) {
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  progress: 100,
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : q
          )
        );
      }
    }

    await loadData(user.id);
    flash(`${items.length} file(s) processed.`);
    window.setTimeout(() => {
      setUploadQueue((prev) => prev.filter((q) => q.status !== 'done'));
    }, 4000);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...e.dataTransfer.files];
    if (files.length) void processUploadQueue(files);
  };

  const openPreview = async (doc: EnterpriseDocument) => {
    setPreviewDoc(doc);
    setPreviewText(null);
    setMayaInsight(null);
    setPreviewLoading(false);

    if (doc.file_kind === 'txt' && doc.file_url) {
      setPreviewLoading(true);
      try {
        const res = await fetch(doc.file_url);
        const text = await res.text();
        setPreviewText(text.slice(0, 12000));
      } catch {
        setPreviewText('Unable to load text preview.');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const runMaya = (doc: EnterpriseDocument) => {
    const insight = buildMayaInsight(doc, documents);
    setMayaInsight(insight);
    setMayaDocId(doc.id);
    flash('MAYA document intelligence generated.');
  };

  const handleShare = async (doc: EnterpriseDocument) => {
    if (!doc.file_url) {
      setError('No shareable URL for this document.');
      return;
    }
    try {
      await navigator.clipboard.writeText(doc.file_url);
      flash('Document link copied to clipboard.');
    } catch {
      setError('Clipboard unavailable — open preview to copy URL manually.');
    }
  };

  const handleArchive = async (doc: EnterpriseDocument) => {
    if (!user) return;
    const tags = [...(doc.tags ?? []).filter((t) => t !== 'archived')];
    if (!doc.archived) tags.push('archived');

    const { error: upErr } = await supabase
      .from('documents')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', doc.id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    await loadData(user.id);
    flash(doc.archived ? 'Document unarchived.' : 'Document archived.');
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Permanently delete this document?')) return;
    const { error: delErr } = await supabase.from('documents').delete().eq('id', id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    if (previewDoc?.id === id) setPreviewDoc(null);
    await loadData(user.id);
    flash('Document deleted.');
  };

  const suggestUploadTags = () => {
    const project = projects.find((p) => p.id === uploadProjectId);
    const tags = [
      MODULE_LABELS[uploadModule].toLowerCase(),
      'xlab-knowledge',
      project?.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20) ?? '',
    ].filter(Boolean);
    setUploadTags(tags.join(', '));
    flash('MAYA suggested upload tags.');
  };

  if (authLoading || loading) {
    return (
      <div className="edc-page">
        <div className="edc-loading" aria-label="Loading document center" />
      </div>
    );
  }

  return (
    <div className="edc-page">
      <header className="edc-topbar">
        <div className="edc-topbar__brand">
          <Link to="/dashboard" className="edc-back">
            ← Innovation OS
          </Link>
          <h1>Enterprise Document Center</h1>
          <p>Central knowledge repository across the full Maylet XLab innovation lifecycle.</p>
        </div>
        <nav className="edc-pipeline" aria-label="Innovation pipeline">
          {PIPELINE.map((step) => (
            <span
              key={step}
              className={`edc-pipeline__step ${step === 'Research' ? 'edc-pipeline__step--on' : ''}`}
            >
              {step}
            </span>
          ))}
        </nav>
      </header>

      {error && <div className="edc-alert edc-alert--error">{error}</div>}
      {toast && <div className="edc-alert edc-alert--ok">{toast}</div>}

      <section className="edc-metrics" aria-label="Document metrics">
        {(
          [
            ['Total Documents', metrics.total],
            ['Research', metrics.research],
            ['Prototype', metrics.prototype],
            ['Experiment', metrics.experiment],
            ['Validation', metrics.validation],
            ['Funding', metrics.funding],
            ['Commercialization', metrics.commercialization],
            ['Storage Usage', formatBytes(metrics.storageBytes)],
          ] as const
        ).map(([label, value]) => (
          <article key={label} className="edc-metric">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="edc-toolbar">
        <div className="edc-search-row">
          <input
            className="edc-search"
            type="search"
            placeholder="Search title, project, tags, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="edc-search edc-search--sm"
            type="search"
            placeholder="Filter by author"
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
          />
        </div>
        <div className="edc-toolbar__controls">
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FileKind)}
          >
            {FILE_TYPES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
          <label className="edc-check">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Archived
          </label>
          <div className="edc-view-toggle">
            <button
              type="button"
              className={viewMode === 'grid' ? 'on' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={viewMode === 'table' ? 'on' : ''}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
          </div>
        </div>
        <div className="edc-module-filters">
          <button
            type="button"
            className={filterModule === 'all' ? 'on' : ''}
            onClick={() => setFilterModule('all')}
          >
            All modules
          </button>
          {LIFECYCLE_MODULES.map((mod) => (
            <button
              key={mod}
              type="button"
              className={filterModule === mod ? 'on' : ''}
              onClick={() => setFilterModule(mod)}
            >
              {MODULE_LABELS[mod]} ({metrics[mod]})
            </button>
          ))}
        </div>
      </section>

      <div className="edc-body">
        <aside className="edc-sidebar">
          <section className="edc-panel">
            <h2>MAYA Document Intelligence</h2>
            {mayaInsight && mayaDocId ? (
              <div className="edc-maya">
                <p className="edc-maya__summary">{mayaInsight.summary}</p>
                <h3>Key findings</h3>
                <ul>{mayaInsight.keyFindings.map((f) => <li key={f}>{f}</li>)}</ul>
                <h3>Insights</h3>
                <ul>{mayaInsight.insights.map((f) => <li key={f}>{f}</li>)}</ul>
                <h3>Important</h3>
                <ul>{mayaInsight.importantFlags.map((f) => <li key={f}>{f}</li>)}</ul>
                <h3>Next actions</h3>
                <ul>{mayaInsight.nextActions.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            ) : (
              <p className="edc-muted">Select a document and run MAYA analysis from the library.</p>
            )}
            <div className="edc-maya-actions">
              <button type="button" onClick={suggestUploadTags}>
                ✨ Suggest upload tags
              </button>
            </div>
          </section>

          <section className="edc-panel">
            <h2>Project integration</h2>
            <p className="edc-muted">Every pipeline module links to project documents.</p>
            <ul className="edc-tree">
              {projects.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  <div className="edc-tree__links">
                    {LIFECYCLE_MODULES.map((mod) => (
                      <Link key={mod} to={MODULE_ROUTES[mod](p.id)}>
                        {MODULE_LABELS[mod]}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            {projects.length > 8 && (
              <p className="edc-muted">+{projects.length - 8} more projects</p>
            )}
          </section>
        </aside>

        <main className="edc-main">
          <section className="edc-panel">
            <h2>Upload center</h2>
            <div
              className={`edc-dropzone ${dragOver ? 'edc-dropzone--over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <p>Drag & drop files here or browse</p>
              <p className="edc-muted">PDF · DOCX · PPTX · XLSX · TXT · CSV · PNG · JPG · ZIP</p>
              <button
                type="button"
                className="edc-btn edc-btn--primary"
                disabled={!uploadProjectId}
                onClick={() => fileRef.current?.click()}
              >
                Browse files
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.zip"
                hidden
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  if (files.length) void processUploadQueue(files);
                  e.target.value = '';
                }}
              />
            </div>

            <form className="edc-upload-meta" onSubmit={(e: FormEvent) => e.preventDefault()}>
              <div className="edc-grid-3">
                <label>
                  Project *
                  <select
                    value={uploadProjectId}
                    onChange={(e) => setUploadProjectId(e.target.value)}
                    required
                  >
                    <option value="">Select…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Module
                  <select
                    value={uploadModule}
                    onChange={(e) => setUploadModule(e.target.value as LifecycleModule)}
                  >
                    {LIFECYCLE_MODULES.map((m) => (
                      <option key={m} value={m}>
                        {MODULE_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Version
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="1.0"
                  />
                </label>
              </div>
              <label>
                Tags
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="evidence, deck-v3, gtm"
                />
              </label>
              <label>
                Description
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Purpose in validation, funding, or commercialization workflow"
                />
              </label>
            </form>

            {uploadQueue.length > 0 && (
              <ul className="edc-queue">
                {uploadQueue.map((q) => (
                  <li key={q.id}>
                    <span>{q.file.name}</span>
                    <div className="edc-progress">
                      <div style={{ width: `${q.progress}%` }} />
                    </div>
                    <em className={q.status === 'error' ? 'err' : ''}>
                      {q.status === 'error' ? q.error : q.status}
                    </em>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="edc-panel">
            <div className="edc-panel__head">
              <h2>Document library</h2>
              <span className="edc-muted">{filtered.length} results</span>
            </div>

            {filtered.length === 0 ? (
              <div className="edc-empty">
                <p>No documents match your enterprise search criteria.</p>
                <Link to="/projects/create" className="edc-btn edc-btn--ghost">
                  Create project
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="edc-grid">
                {filtered.map((doc) => (
                  <article
                    key={doc.id}
                    className={`edc-card ${doc.archived ? 'edc-card--archived' : ''}`}
                  >
                    <div className="edc-card__icon">{doc.file_kind.toUpperCase()}</div>
                    <h3>{doc.name}</h3>
                    <p>
                      {doc.project_name} · {MODULE_LABELS[doc.module]}
                    </p>
                    <dl className="edc-card__meta">
                      <div>
                        <dt>Owner</dt>
                        <dd>{doc.author_name}</dd>
                      </div>
                      <div>
                        <dt>Version</dt>
                        <dd>v{doc.version}</dd>
                      </div>
                      <div>
                        <dt>Uploaded</dt>
                        <dd>{new Date(doc.created_at).toLocaleDateString()}</dd>
                      </div>
                    </dl>
                    {(doc.tags ?? []).length > 0 && (
                      <div className="edc-tags">
                        {(doc.tags ?? [])
                          .filter((t) => !t.startsWith('module:') && !t.startsWith('version:'))
                          .slice(0, 4)
                          .map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                      </div>
                    )}
                    <div className="edc-card__actions">
                      <button type="button" onClick={() => openPreview(doc)}>
                        Preview
                      </button>
                      {doc.file_url && (
                        <a href={doc.file_url} download>
                          Download
                        </a>
                      )}
                      <button type="button" onClick={() => handleShare(doc)}>
                        Share
                      </button>
                      <button type="button" onClick={() => handleArchive(doc)}>
                        {doc.archived ? 'Restore' : 'Archive'}
                      </button>
                      <button type="button" onClick={() => runMaya(doc)}>
                        MAYA
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(doc.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="edc-table-wrap">
                <table className="edc-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Project</th>
                      <th>Module</th>
                      <th>Owner</th>
                      <th>Version</th>
                      <th>Uploaded</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => (
                      <tr key={doc.id} className={doc.archived ? 'archived' : ''}>
                        <td>
                          <strong>{doc.name}</strong>
                          <span className="edc-muted">{doc.file_kind.toUpperCase()}</span>
                        </td>
                        <td>{doc.project_name}</td>
                        <td>{MODULE_LABELS[doc.module]}</td>
                        <td>{doc.author_name}</td>
                        <td>v{doc.version}</td>
                        <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="edc-tags edc-tags--inline">
                            {(doc.tags ?? [])
                              .filter((t) => !t.startsWith('module:') && !t.startsWith('version:'))
                              .slice(0, 3)
                              .map((t) => (
                                <span key={t}>{t}</span>
                              ))}
                          </div>
                        </td>
                        <td className="edc-table__actions">
                          <button type="button" onClick={() => openPreview(doc)}>
                            Preview
                          </button>
                          {doc.file_url && (
                            <a href={doc.file_url} download>
                              Download
                            </a>
                          )}
                          <button type="button" onClick={() => handleShare(doc)}>
                            Share
                          </button>
                          <button type="button" onClick={() => handleArchive(doc)}>
                            {doc.archived ? 'Restore' : 'Archive'}
                          </button>
                          <button type="button" onClick={() => runMaya(doc)}>
                            MAYA
                          </button>
                          <button type="button" className="danger" onClick={() => handleDelete(doc.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {previewDoc && (
        <div className="edc-modal" role="dialog" aria-modal="true">
          <div className="edc-modal__backdrop" onClick={() => setPreviewDoc(null)} />
          <div className="edc-modal__panel">
            <header className="edc-modal__head">
              <div>
                <h2>{previewDoc.name}</h2>
                <p>
                  {previewDoc.project_name} · {MODULE_LABELS[previewDoc.module]} · v
                  {previewDoc.version} · {previewDoc.author_name}
                </p>
              </div>
              <button type="button" className="edc-modal__close" onClick={() => setPreviewDoc(null)}>
                ×
              </button>
            </header>
            <div className="edc-modal__body">
              <dl className="edc-meta-grid">
                <div>
                  <dt>Category</dt>
                  <dd>{previewDoc.category ?? '—'}</dd>
                </div>
                <div>
                  <dt>File type</dt>
                  <dd>{previewDoc.file_kind}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{formatBytes(previewDoc.size_bytes ?? 0)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{new Date(previewDoc.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(previewDoc.updated_at ?? previewDoc.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Project link</dt>
                  <dd>
                    <Link to={MODULE_ROUTES[previewDoc.module](previewDoc.project_id)}>
                      Open module
                    </Link>
                  </dd>
                </div>
              </dl>

              {previewDoc.description && (
                <p className="edc-preview-desc">{previewDoc.description}</p>
              )}

              <div className="edc-preview-frame">
                {previewLoading && <p>Loading preview…</p>}
                {!previewLoading && previewDoc.file_kind === 'pdf' && previewDoc.file_url && (
                  <iframe title="PDF preview" src={previewDoc.file_url} />
                )}
                {!previewLoading &&
                  (previewDoc.file_kind === 'png' || previewDoc.file_kind === 'jpg') &&
                  previewDoc.file_url && (
                    <img src={previewDoc.file_url} alt={previewDoc.name} />
                  )}
                {!previewLoading && previewDoc.file_kind === 'txt' && previewText && (
                  <pre>{previewText}</pre>
                )}
                {!previewLoading &&
                  ['docx', 'pptx', 'xlsx', 'csv', 'zip', 'other'].includes(previewDoc.file_kind) && (
                    <div className="edc-preview-fallback">
                      <p>
                        Inline preview for {previewDoc.file_kind.toUpperCase()} requires download.
                      </p>
                      {previewDoc.file_url && (
                        <a href={previewDoc.file_url} download className="edc-btn edc-btn--primary">
                          Download to open
                        </a>
                      )}
                    </div>
                  )}
              </div>

              <div className="edc-modal__actions">
                <button type="button" onClick={() => runMaya(previewDoc)}>
                  ✨ MAYA analyze
                </button>
                <button type="button" onClick={() => handleShare(previewDoc)}>
                  Share link
                </button>
                {previewDoc.file_url && (
                  <a href={previewDoc.file_url} target="_blank" rel="noreferrer">
                    Open in tab
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .edc-page {
          min-height: 100vh;
          padding: 1.25rem 1.5rem 3rem;
          color: #e8eaf6;
          background: linear-gradient(160deg, #070b14 0%, #0c1222 45%, #101828 100%);
        }
        .edc-topbar { margin-bottom: 1.25rem; }
        .edc-back { color: #7c9cff; text-decoration: none; font-size: 0.85rem; }
        .edc-topbar h1 {
          margin: 0.4rem 0 0.2rem;
          font-size: 1.85rem;
          background: linear-gradient(135deg, #fff, #7c9cff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .edc-topbar p { margin: 0; opacity: 0.65; font-size: 0.92rem; }
        .edc-pipeline {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.85rem;
        }
        .edc-pipeline__step {
          padding: 0.28rem 0.65rem;
          border-radius: 16px;
          font-size: 0.62rem;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.08);
          opacity: 0.45;
        }
        .edc-pipeline__step--on {
          opacity: 1;
          color: #7c9cff;
          border-color: rgba(124,156,255,0.45);
          background: rgba(124,156,255,0.12);
        }
        .edc-alert {
          padding: 0.7rem 1rem;
          border-radius: 10px;
          margin-bottom: 0.85rem;
          font-size: 0.86rem;
        }
        .edc-alert--error {
          background: rgba(252,129,129,0.12);
          border: 1px solid rgba(252,129,129,0.35);
          color: #fc8181;
        }
        .edc-alert--ok {
          background: rgba(104,211,145,0.12);
          border: 1px solid rgba(104,211,145,0.35);
          color: #68d391;
        }
        .edc-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 900px) { .edc-metrics { grid-template-columns: repeat(2, 1fr); } }
        .edc-metric {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 0.75rem 0.9rem;
        }
        .edc-metric span {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.55;
        }
        .edc-metric strong { font-size: 1.2rem; }
        .edc-toolbar {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .edc-search-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 0.65rem;
          margin-bottom: 0.75rem;
        }
        @media (max-width: 720px) { .edc-search-row { grid-template-columns: 1fr; } }
        .edc-search,
        .edc-toolbar select {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
          color: #fff;
          font-size: 0.88rem;
        }
        .edc-toolbar__controls {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .edc-check {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          opacity: 0.85;
        }
        .edc-view-toggle {
          display: flex;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          overflow: hidden;
        }
        .edc-view-toggle button {
          background: transparent;
          border: none;
          color: #fff;
          padding: 0.45rem 0.75rem;
          cursor: pointer;
          font-size: 0.78rem;
        }
        .edc-view-toggle button.on {
          background: rgba(124,156,255,0.25);
          color: #a5b8ff;
        }
        .edc-module-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .edc-module-filters button {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
          border-radius: 18px;
          padding: 0.3rem 0.7rem;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
        }
        .edc-module-filters button.on {
          background: rgba(124,156,255,0.2);
          border-color: rgba(124,156,255,0.45);
          color: #c7d4ff;
        }
        .edc-body {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 1rem;
          align-items: start;
        }
        @media (max-width: 1024px) { .edc-body { grid-template-columns: 1fr; } }
        .edc-sidebar { display: flex; flex-direction: column; gap: 1rem; }
        .edc-main { display: flex; flex-direction: column; gap: 1rem; }
        .edc-panel {
          background: rgba(0,0,0,0.32);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.1rem;
        }
        .edc-panel h2 {
          margin: 0 0 0.75rem;
          font-size: 0.95rem;
          color: #a5b8ff;
        }
        .edc-panel__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .edc-panel__head h2 { margin: 0; }
        .edc-muted { opacity: 0.6; font-size: 0.82rem; }
        .edc-dropzone {
          border: 2px dashed rgba(124,156,255,0.35);
          border-radius: 14px;
          padding: 1.5rem;
          text-align: center;
          margin-bottom: 1rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .edc-dropzone--over {
          border-color: #7c9cff;
          background: rgba(124,156,255,0.08);
        }
        .edc-upload-meta label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.76rem;
          font-weight: 600;
          margin-bottom: 0.65rem;
        }
        .edc-upload-meta input,
        .edc-upload-meta select,
        .edc-upload-meta textarea {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.55rem 0.7rem;
          color: #fff;
          font-family: inherit;
        }
        .edc-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.65rem;
        }
        @media (max-width: 720px) { .edc-grid-3 { grid-template-columns: 1fr; } }
        .edc-queue {
          list-style: none;
          margin: 0.75rem 0 0;
          padding: 0;
        }
        .edc-queue li {
          display: grid;
          grid-template-columns: 1fr 120px auto;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.78rem;
          margin-bottom: 0.35rem;
        }
        .edc-progress {
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .edc-progress div {
          height: 100%;
          background: linear-gradient(90deg, #7c9cff, #2fd4ff);
        }
        .edc-queue em { font-style: normal; opacity: 0.7; text-transform: capitalize; }
        .edc-queue em.err { color: #fc8181; }
        .edc-btn {
          padding: 0.55rem 1rem;
          border-radius: 24px;
          font-weight: 600;
          font-size: 0.84rem;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .edc-btn--primary {
          background: linear-gradient(135deg, #5b7cfa, #2fd4ff);
          color: #0a0d1a;
        }
        .edc-btn--ghost { background: rgba(255,255,255,0.08); color: #fff; }
        .edc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.75rem;
        }
        .edc-card {
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 0.9rem;
        }
        .edc-card--archived { opacity: 0.55; }
        .edc-card__icon {
          font-size: 0.65rem;
          font-weight: 800;
          color: #7c9cff;
          margin-bottom: 0.35rem;
        }
        .edc-card h3 {
          margin: 0 0 0.25rem;
          font-size: 0.92rem;
          line-height: 1.3;
        }
        .edc-card p { margin: 0 0 0.5rem; font-size: 0.75rem; opacity: 0.65; }
        .edc-card__meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.35rem;
          margin: 0 0 0.5rem;
        }
        .edc-card__meta dt { font-size: 0.58rem; opacity: 0.5; text-transform: uppercase; }
        .edc-card__meta dd { margin: 0; font-size: 0.72rem; font-weight: 600; }
        .edc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-bottom: 0.5rem;
        }
        .edc-tags span {
          background: rgba(124,156,255,0.15);
          border-radius: 10px;
          padding: 0.12rem 0.45rem;
          font-size: 0.62rem;
          color: #c7d4ff;
        }
        .edc-tags--inline span { font-size: 0.6rem; }
        .edc-card__actions,
        .edc-table__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .edc-card__actions button,
        .edc-card__actions a,
        .edc-table__actions button,
        .edc-table__actions a {
          background: none;
          border: none;
          color: #2fd4ff;
          font-size: 0.72rem;
          cursor: pointer;
          text-decoration: none;
          padding: 0;
        }
        .edc-card__actions .danger,
        .edc-table__actions .danger { color: #fc8181; }
        .edc-table-wrap { overflow-x: auto; }
        .edc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        .edc-table th,
        .edc-table td {
          text-align: left;
          padding: 0.55rem 0.45rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          vertical-align: top;
        }
        .edc-table th {
          font-size: 0.68rem;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .edc-table tr.archived { opacity: 0.55; }
        .edc-table td strong { display: block; }
        .edc-empty { text-align: center; padding: 2rem; opacity: 0.75; }
        .edc-maya h3 {
          margin: 0.65rem 0 0.25rem;
          font-size: 0.72rem;
          color: #7c9cff;
          text-transform: uppercase;
        }
        .edc-maya ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.78rem;
          opacity: 0.85;
        }
        .edc-maya__summary {
          font-size: 0.82rem;
          line-height: 1.45;
          opacity: 0.9;
        }
        .edc-maya-actions button {
          background: rgba(124,156,255,0.18);
          border: 1px solid rgba(124,156,255,0.35);
          color: #c7d4ff;
          border-radius: 18px;
          padding: 0.35rem 0.75rem;
          font-size: 0.74rem;
          cursor: pointer;
        }
        .edc-tree {
          list-style: none;
          margin: 0;
          padding: 0;
          font-size: 0.8rem;
        }
        .edc-tree li {
          padding: 0.55rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .edc-tree__links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.35rem;
        }
        .edc-tree__links a {
          color: #2fd4ff;
          text-decoration: none;
          font-size: 0.68rem;
        }
        .edc-modal {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .edc-modal__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.65);
        }
        .edc-modal__panel {
          position: relative;
          width: min(920px, 100%);
          max-height: 90vh;
          overflow: auto;
          background: #0f1528;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
        }
        .edc-modal__head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.1rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .edc-modal__head h2 { margin: 0; font-size: 1.05rem; }
        .edc-modal__head p { margin: 0.25rem 0 0; font-size: 0.78rem; opacity: 0.65; }
        .edc-modal__close {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }
        .edc-modal__body { padding: 1rem 1.1rem 1.25rem; }
        .edc-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin: 0 0 0.75rem;
        }
        @media (max-width: 640px) { .edc-meta-grid { grid-template-columns: 1fr 1fr; } }
        .edc-meta-grid dt { font-size: 0.62rem; opacity: 0.5; text-transform: uppercase; }
        .edc-meta-grid dd { margin: 0.15rem 0 0; font-size: 0.82rem; font-weight: 600; }
        .edc-meta-grid a { color: #2fd4ff; text-decoration: none; }
        .edc-preview-desc {
          font-size: 0.84rem;
          opacity: 0.85;
          margin: 0 0 0.75rem;
        }
        .edc-preview-frame {
          min-height: 280px;
          background: rgba(0,0,0,0.35);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        .edc-preview-frame iframe {
          width: 100%;
          height: 420px;
          border: none;
        }
        .edc-preview-frame img {
          max-width: 100%;
          max-height: 420px;
          display: block;
          margin: 0 auto;
        }
        .edc-preview-frame pre {
          margin: 0;
          padding: 1rem;
          font-size: 0.78rem;
          white-space: pre-wrap;
          max-height: 420px;
          overflow: auto;
        }
        .edc-preview-fallback {
          padding: 2rem;
          text-align: center;
          opacity: 0.8;
        }
        .edc-modal__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .edc-modal__actions button,
        .edc-modal__actions a {
          background: rgba(124,156,255,0.15);
          border: 1px solid rgba(124,156,255,0.3);
          color: #c7d4ff;
          border-radius: 18px;
          padding: 0.4rem 0.8rem;
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: none;
        }
        .edc-loading {
          width: 44px;
          height: 44px;
          margin: 5rem auto;
          border: 3px solid rgba(124,156,255,0.2);
          border-top-color: #7c9cff;
          border-radius: 50%;
          animation: edc-spin 0.8s linear infinite;
        }
        @keyframes edc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
