import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AIInsightsPanel } from '../components/preview/AIInsightsPanel';
import { ActivityTimeline } from '../components/preview/ActivityTimeline';
import { ArchitectureViewer } from '../components/preview/ArchitectureViewer';
import { CommercializationPanel } from '../components/preview/CommercializationPanel';
import { DocumentationViewer, AttachmentsViewer } from '../components/preview/DocumentationViewer';
import { EvidenceCenter } from '../components/preview/EvidenceCenter';
import { ExecutiveSummary } from '../components/preview/ExecutiveSummary';
import { FeaturesShowcase } from '../components/preview/FeaturesShowcase';
import { ProblemMarketSection } from '../components/preview/ProblemMarketSection';
import { PrototypeGallery } from '../components/preview/PrototypeGallery';
import { PrototypeHero } from '../components/preview/PrototypeHero';
import { ReviewPanel } from '../components/preview/ReviewPanel';
import { SolutionOverview } from '../components/preview/SolutionOverview';
import { UserFlowViewer } from '../components/preview/UserFlowViewer';
import { ValidationDashboard } from '../components/preview/ValidationDashboard';
import { usePrototypePreview } from '../hooks/usePrototypePreview';
import type { PrototypeBuilderMeta } from '../types/prototypeBuilder.types';
import { PREVIEW_SECTIONS } from '../types/prototypePreview.types';
import type { PrototypeRecord } from '../types/prototype.types';
import '../prototype.css';

function buildSummaryText(prototype: PrototypeRecord, meta: PrototypeBuilderMeta): string {
  return [
    `# ${prototype.name}`,
    '',
    meta.description || prototype.description || '',
    '',
    '## Problem',
    meta.problemStatement || '—',
    '',
    '## Solution',
    meta.solutionOverview || '—',
    '',
    '## Innovation',
    meta.keyInnovation || '—',
    '',
    '## Competitive advantage',
    meta.competitiveAdvantage || '—',
    '',
    `Version: ${prototype.version}`,
    `Stage: ${meta.workspaceStage}`,
    `Updated: ${prototype.updated_at}`,
  ].join('\n');
}

export default function PrototypePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('showcase');

  const preview = usePrototypePreview({
    userId: user?.id,
    prototypeId: id ?? '',
    viewerName: user?.email?.split('@')[0],
  });

  const {
    prototype,
    meta,
    screenshots,
    tests,
    reviews,
    submitReview,
    avgRating,
    passRate,
    recommendation,
    commercial,
    loading,
    error,
  } = preview;

  const scrollTo = useCallback((sectionId: string) => {
    setActiveNav(sectionId);
    document.getElementById(`proto-preview-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied to clipboard');
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(null), 3000);
  }, []);

  const handleDownloadSummary = useCallback(() => {
    if (!prototype) return;
    const blob = new Blob([buildSummaryText(prototype, meta)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${prototype.name.replace(/\s+/g, '-').toLowerCase()}-summary.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [prototype, meta]);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  if (!id) {
    navigate('/prototypes');
    return null;
  }

  if (loading) {
    return (
      <div className="proto-page proto-preview-page">
        <p className="proto-preview-loading">Loading presentation…</p>
      </div>
    );
  }

  if (error || !prototype) {
    return (
      <div className="proto-page proto-preview-page">
        <p className="proto-error">{error ?? 'Prototype not found or access denied.'}</p>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">
          ← Back to prototypes
        </Link>
      </div>
    );
  }

  return (
    <div className="proto-page proto-preview-page">
      <PrototypeHero
        prototype={prototype}
        meta={meta}
        creatorLabel={user?.email?.split('@')[0] ?? 'Innovation team'}
        onShare={() => void handleShare()}
        onDownloadSummary={handleDownloadSummary}
        onExportPdf={handleExportPdf}
      />

      {shareMsg ? <p className="proto-preview-toast" role="status">{shareMsg}</p> : null}

      <nav className="proto-preview-nav" aria-label="Presentation sections">
        {PREVIEW_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`proto-preview-nav__item${activeNav === s.id ? ' proto-preview-nav__item--active' : ''}`}
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="proto-preview-layout">
        <main className="proto-preview-main">
          <PrototypeGallery screenshots={screenshots} prototypeName={prototype.name} />
          <ExecutiveSummary meta={meta} />
          <ProblemMarketSection meta={meta} />
          <SolutionOverview meta={meta} />
          <UserFlowViewer meta={meta} />
          <FeaturesShowcase meta={meta} />
          <ArchitectureViewer meta={meta} screenshots={screenshots} />
          <EvidenceCenter meta={meta} />
          <ValidationDashboard
            meta={meta}
            passRate={passRate}
            readinessScore={recommendation?.readinessScore ?? null}
            tests={tests}
            avgRating={avgRating}
          />
          {commercial ? <CommercializationPanel readiness={commercial} /> : null}
          <DocumentationViewer meta={meta} />
          <AttachmentsViewer meta={meta} />
          <ReviewPanel
            reviews={reviews}
            avgRating={avgRating}
            canReview={!!user}
            onSubmit={(payload) => submitReview(payload)}
          />
          <ActivityTimeline prototype={prototype} meta={meta} reviews={reviews} tests={tests} />
        </main>

        <AIInsightsPanel recommendation={recommendation} commercial={commercial} />
      </div>
    </div>
  );
}
