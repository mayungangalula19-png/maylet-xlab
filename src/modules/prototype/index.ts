export { default as PrototypesDashboard } from './pages/PrototypesDashboard';
export { default as PrototypeDashboard } from './pages/PrototypesDashboard';
export { default as NewPrototype } from './pages/NewPrototype';
export { default as PrototypeWorkspace } from './pages/PrototypeWorkspace';
export { default as PrototypeBuilder } from './pages/PrototypeBuilder';
export { default as PrototypeTesting } from './pages/PrototypeTesting';
export { default as UploadPrototypePage } from './pages/UploadPrototypePage';
export { default as PrototypePreviewPage } from './pages/PrototypePreviewPage';

export * from './types/prototype.types';
export {
  prototypeService,
  createPrototype,
  uploadPrototypeBuild,
} from './services/prototypeService';
export { uploadService } from './services/uploadService';
export { buildService } from './services/buildService';
export { testingService } from './services/testingService';
export { versionService } from './services/versionService';
export { usePrototype } from './hooks/usePrototype';
export { usePrototypeTesting } from './hooks/usePrototypeTesting';
export { useBuildRunner } from './hooks/useBuildRunner';

export { CreatePrototypeForm } from './components/CreatePrototypeForm';
export { PrototypeCard } from './components/PrototypeCard';
export { PrototypeStats } from './components/PrototypeStats';
export { PrototypeLifecycle } from './components/PrototypeLifecycle';
export { PrototypeEmptyState } from './components/PrototypeEmptyState';
export { AIEvaluationPanel } from './components/AIEvaluationPanel';
export { ResearchLinkPanel } from './components/ResearchLinkPanel';
export { BuildEditor } from './components/BuildEditor';
export { TestResultsPanel } from './components/TestResultsPanel';
export { VersionHistory } from './components/VersionHistory';
export { DeploymentPreview } from './components/DeploymentPreview';
export { PrototypeUpload } from './components/PrototypeUpload';

export {
  analyzePrototypeRisk,
  suggestImprovements,
  predictFailurePoints,
  optimizePerformance,
} from './ai/prototypeAI.engine';
export { getPrototypeRecommendation } from './ai/recommendationEngine';
export { scorePrototypeRisk, getRiskLevel, riskSummary } from './ai/riskAnalyzer';
export { predictPerformance } from './ai/performancePredictor';
