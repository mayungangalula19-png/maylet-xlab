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
export { usePrototypeTestingCenter } from './hooks/usePrototypeTestingCenter';
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
export { PrototypeImageGallery } from './components/PrototypeImageGallery';
export { VisualProofSection } from './components/VisualProofSection';

export * from './types/prototypeCreation.types';
export { usePrototypeCreation } from './hooks/usePrototypeCreation';
export { PrototypeHeader } from './components/creation/PrototypeHeader';
export { PrototypeDetailsForm } from './components/creation/PrototypeDetailsForm';
export { PrototypeVisualsSection } from './components/creation/PrototypeVisualsSection';
export { ProblemStatementSection } from './components/creation/ProblemStatementSection';
export { SolutionDesignSection } from './components/creation/SolutionDesignSection';
export { UserFlowSection } from './components/creation/UserFlowSection';
export { FeaturesSection } from './components/creation/FeaturesSection';
export { ArchitectureSection } from './components/creation/ArchitectureSection';
export { ExperimentsSection } from './components/creation/ExperimentsSection';
export { ValidationSection } from './components/creation/ValidationSection';
export { AttachmentsSection } from './components/creation/AttachmentsSection';
export {
  PrototypeStatusTracker,
  PrototypeStatusTrackerBar,
} from './components/creation/PrototypeStatusTracker';
export { AIPrototypeAssistant } from './components/creation/AIPrototypeAssistant';

export * from './types/prototypeBuilder.types';
export { usePrototypeBuilder } from './hooks/usePrototypeBuilder';
export { BuilderHeader } from './components/builder/BuilderHeader';
export { BuilderSidebar } from './components/builder/BuilderSidebar';
export { PrototypeOverview } from './components/builder/PrototypeOverview';
export { VisualBuilder } from './components/builder/VisualBuilder';
export { UserFlowDesigner } from './components/builder/UserFlowDesigner';
export { FeatureBoard } from './components/builder/FeatureBoard';
export { ArchitectureDesigner } from './components/builder/ArchitectureDesigner';
export { ExperimentDesigner } from './components/builder/ExperimentDesigner';
export { ValidationCenter } from './components/builder/ValidationCenter';
export { DocumentationEditor } from './components/builder/DocumentationEditor';
export { BuilderAttachments } from './components/builder/BuilderAttachments';
export { BuilderLifecycle } from './components/builder/BuilderLifecycle';
export { CollaborationPanel } from './components/builder/CollaborationPanel';
export { BuilderAIPanel } from './components/builder/BuilderAIPanel';
export { BuildRunnerPanel } from './components/builder/BuildRunnerPanel';

export * from './types/prototypePreview.types';
export { usePrototypePreview } from './hooks/usePrototypePreview';
export { PrototypeHero } from './components/preview/PrototypeHero';
export { PrototypeGallery } from './components/preview/PrototypeGallery';
export { ExecutiveSummary } from './components/preview/ExecutiveSummary';
export { ProblemMarketSection } from './components/preview/ProblemMarketSection';
export { SolutionOverview } from './components/preview/SolutionOverview';
export { UserFlowViewer } from './components/preview/UserFlowViewer';
export { FeaturesShowcase } from './components/preview/FeaturesShowcase';
export { ArchitectureViewer } from './components/preview/ArchitectureViewer';
export { EvidenceCenter } from './components/preview/EvidenceCenter';
export { ValidationDashboard } from './components/preview/ValidationDashboard';
export { CommercializationPanel } from './components/preview/CommercializationPanel';
export { DocumentationViewer, AttachmentsViewer } from './components/preview/DocumentationViewer';
export { ReviewPanel } from './components/preview/ReviewPanel';
export { ActivityTimeline } from './components/preview/ActivityTimeline';
export { AIInsightsPanel } from './components/preview/AIInsightsPanel';

export * from './types/commandCenter.types';
export { usePrototypeCommandCenter } from './hooks/usePrototypeCommandCenter';
export { PrototypeCommandCenter } from './components/command-center/PrototypeCommandCenter';
export { ExecutiveHeader } from './components/command-center/ExecutiveHeader';
export { GlobalKPIs } from './components/command-center/GlobalKPIs';
export { InnovationPipeline } from './components/command-center/InnovationPipeline';
export { PrototypePortfolio } from './components/command-center/PrototypePortfolio';
export { PortfolioCard } from './components/command-center/PortfolioCard';
export { AnalyticsDashboard } from './components/command-center/AnalyticsDashboard';
export { AIInnovationInsights } from './components/command-center/AIInnovationInsights';

export * from './types/prototypeTesting.types';
export { PrototypeTestingCenter } from './components/testing/PrototypeTestingCenter';
export { TestingExecutiveHeader } from './components/testing/TestingExecutiveHeader';
export { TestingCommandCenter, TestingDashboardKPIs } from './components/testing/TestingCommandCenter';
export { TestingDashboard } from './components/testing/TestingDashboard';
export { TestPlanManager } from './components/testing/TestPlanManager';
export { TestCaseManager } from './components/testing/TestCaseManager';
export { TestExecutionCenter } from './components/testing/TestExecutionCenter';
export { DefectTracker } from './components/testing/DefectTracker';
export { UsabilityTestingPanel } from './components/testing/UsabilityTestingPanel';
export { PerformanceTestingPanel } from './components/testing/PerformanceTestingPanel';
export { SecurityTestingPanel } from './components/testing/SecurityTestingPanel';
export { ValidationReadinessPanel as TestingValidationReadinessPanel } from './components/testing/ValidationReadinessPanel';
export { EvidenceCenter as TestingEvidenceCenter } from './components/testing/EvidenceCenter';
export { ReportingCenter } from './components/testing/ReportingCenter';
export { AIPrototypeTestingAssistant } from './components/testing/AIPrototypeTestingAssistant';
export { ActivityTimeline as TestingActivityTimeline } from './components/testing/ActivityTimeline';
export { TestingAnalyticsDashboard } from './components/testing/TestingAnalyticsDashboard';
export { TestingRightSidebar } from './components/testing/TestingRightSidebar';

export * from './types/prototypeIngestion.types';
export { usePrototypeIngestion } from './hooks/usePrototypeIngestion';
export { PrototypeIngestionCenter } from './components/ingestion/PrototypeIngestionCenter';
export { UploadExecutiveHeader, UploadCommandCenter } from './components/ingestion/UploadExecutiveHeader';
export { DragDropUploader } from './components/ingestion/DragDropUploader';
export { AssetGallery } from './components/ingestion/AssetGallery';
export { MetadataForm } from './components/ingestion/MetadataForm';
export { UploadProgressTracker } from './components/ingestion/UploadProgressTracker';
export { GitHubImporter } from './components/ingestion/GitHubImporter';
export { FigmaImporter } from './components/ingestion/FigmaImporter';
export { VersionManager } from './components/ingestion/VersionManager';
export { ValidationReadinessPanel as IngestionReadinessPanel } from './components/ingestion/ValidationReadinessPanel';
export { IngestionActivityTimeline } from './components/ingestion/IngestionActivityTimeline';
export { AIUploadAssistant } from './components/ingestion/AIUploadAssistant';

export {
  generateScreenshotDescription,
  generateScreenshotDescriptions,
  formatScreenshotDocumentation,
  buildTemplateDescription,
} from './ai/screenshotDescription.service';
export { screenshotService } from './services/screenshotService';

export {
  analyzePrototypeRisk,
  suggestImprovements,
  predictFailurePoints,
  optimizePerformance,
} from './ai/prototypeAI.engine';
export { getPrototypeRecommendation } from './ai/recommendationEngine';
export { scorePrototypeRisk, getRiskLevel, riskSummary } from './ai/riskAnalyzer';
export { predictPerformance } from './ai/performancePredictor';
