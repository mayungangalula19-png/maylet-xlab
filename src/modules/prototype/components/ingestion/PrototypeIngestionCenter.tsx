import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { usePrototypeIngestion } from '../../hooks/usePrototypeIngestion';
import { newIngestionId } from '../../types/prototypeIngestion.types';
import type { IngestionSectionId } from '../../types/prototypeIngestion.types';
import { AIUploadAssistant } from './AIUploadAssistant';
import { AssetGallery } from './AssetGallery';
import { DragDropUploader } from './DragDropUploader';
import { FigmaImporter } from './FigmaImporter';
import { GitHubImporter } from './GitHubImporter';
import { IngestionActivityTimeline } from './IngestionActivityTimeline';
import { IngestionSidebar } from './IngestionSidebar';
import { MetadataForm } from './MetadataForm';
import { UploadCommandCenter, UploadExecutiveHeader } from './UploadExecutiveHeader';
import { UploadProgressTracker } from './UploadProgressTracker';
import { ValidationReadinessPanel } from './ValidationReadinessPanel';
import { VersionManager } from './VersionManager';

type IngestionState = ReturnType<typeof usePrototypeIngestion>;

interface Props extends IngestionState {
  author: string;
}

export function PrototypeIngestionCenter({
  prototypes,
  projects,
  selectedId,
  setSelectedId,
  selectedPrototype,
  workspace,
  patchWorkspace,
  logActivity,
  kpis,
  readiness,
  uploadFile,
  importGitHub,
  importFigma,
  addVersion,
  runAnalysis,
  activeSection,
  setActiveSection,
  uploading,
  author,
}: Props) {
  const [collabText, setCollabText] = useState('');
  const section = activeSection as IngestionSectionId;
  const disabled = uploading;

  const handleComment = (text: string) => {
    patchWorkspace({
      comments: [{ id: newIngestionId(), author, text, createdAt: new Date().toISOString() }, ...workspace.comments],
    });
    logActivity(`Comment: ${text.slice(0, 60)}`, 'comment');
  };

  const renderSection = () => {
    switch (section) {
      case 'upload':
        return (
          <>
            {!selectedId ? (
              <div className="proto-ingest-panel proto-ingest-panel--warn">
                <p>Select a prototype below to begin ingestion.</p>
              </div>
            ) : (
              <DragDropUploader disabled={disabled} onUpload={uploadFile} />
            )}
            <UploadProgressTracker assets={workspace.assets} />
          </>
        );
      case 'gallery':
        return <AssetGallery assets={workspace.assets} />;
      case 'metadata':
        return (
          <MetadataForm
            metadata={workspace.metadata}
            projects={projects}
            disabled={disabled}
            onChange={(patch) => patchWorkspace({ metadata: { ...workspace.metadata, ...patch } })}
          />
        );
      case 'github':
        return <GitHubImporter imports={workspace.githubImports} disabled={disabled} onImport={importGitHub} />;
      case 'figma':
        return <FigmaImporter imports={workspace.figmaImports} disabled={disabled} onImport={importFigma} />;
      case 'versions':
        return <VersionManager versions={workspace.versions} disabled={disabled} onAdd={addVersion} />;
      case 'readiness':
        return <ValidationReadinessPanel readiness={readiness} />;
      case 'activity':
        return <IngestionActivityTimeline workspace={workspace} />;
      default:
        return null;
    }
  };

  return (
    <div className="proto-ingest">
      <UploadExecutiveHeader
        onUpload={() => setActiveSection('upload')}
        onGitHub={() => setActiveSection('github')}
        onFigma={() => setActiveSection('figma')}
        onDrive={() => logActivity('Google Drive import requested (integration pending)', 'import')}
        onLocal={() => setActiveSection('upload')}
      />

      <UploadCommandCenter kpis={kpis} />

      <div className="proto-ingest-target">
        <label htmlFor="proto-ingest-select" className="proto-field">
          <span>Target prototype</span>
        </label>
        <select
          id="proto-ingest-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Choose prototype to ingest into…</option>
          {prototypes.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedPrototype ? (
          <div className="proto-ingest-target__meta">
            <span>v{selectedPrototype.version}</span>
            <Link to={`/prototypes/${selectedId}/testing`} className="proto-btn proto-btn--ghost">Testing center</Link>
            <Link to={`/prototypes/${selectedId}/workspace`} className="proto-btn proto-btn--ghost">Workspace</Link>
          </div>
        ) : null}
      </div>

      <div className="proto-ingest-layout">
        <IngestionSidebar active={section} onSelect={setActiveSection} />
        <main className="proto-ingest-main">
          {renderSection()}
          <div className="proto-ingest-collab">
            <h3>Collaboration</h3>
            <div className="proto-form-grid proto-form-grid--2">
              <input value={workspace.owner} placeholder="Upload owner" onChange={(e) => patchWorkspace({ owner: e.target.value })} />
              <input
                value={workspace.reviewers.join(', ')}
                placeholder="Reviewers (comma-separated)"
                onChange={(e) => patchWorkspace({ reviewers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
            <textarea rows={2} value={collabText} placeholder="Comment or review request" onChange={(e) => setCollabText(e.target.value)} />
            <button type="button" className="proto-btn proto-btn--secondary" disabled={!collabText.trim()} onClick={() => { handleComment(collabText); setCollabText(''); }}>
              Post comment
            </button>
            {workspace.comments.slice(0, 4).map((c) => (
              <div key={c.id} className="proto-ingest-collab__item"><strong>{c.author}</strong><p>{c.text}</p></div>
            ))}
          </div>
        </main>
        <AIUploadAssistant
          workspace={workspace}
          readiness={readiness}
          analysis={workspace.aiAnalysis}
          prototypeName={selectedPrototype?.name}
          disabled={disabled}
          onRunAnalysis={runAnalysis}
          onApplyTags={(tags) =>
            patchWorkspace({ metadata: { ...workspace.metadata, tags: [...new Set([...workspace.metadata.tags, ...tags])] } })
          }
        />
      </div>
    </div>
  );
}
