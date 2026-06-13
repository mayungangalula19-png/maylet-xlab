export { default as ResearchDashboard } from './pages/ResearchDashboard';
export { default as ResearchWorkspace } from './pages/ResearchWorkspace';
export { default as LiteratureReview } from './pages/LiteratureReview';
export { default as ResearchDocuments } from './pages/ResearchDocuments';
export { default as ResearchPlaybook } from './pages/ResearchPlaybook';

export * from './types/research.types';
export * from './types/gate.types';
export { researchService } from './services/researchService';
export { literatureService } from './services/literatureService';
export { documentService } from './services/documentService';
export { gateService } from './services/gateService';
export { useResearch } from './hooks/useResearch';
export { useMayaAI } from './hooks/useMayaAI';
export { useGateApproval } from './hooks/useGateApproval';

export { ResearchCard } from './components/ResearchCard';
export { ResearchStats } from './components/ResearchStats';
export { NotesEditor } from './components/NotesEditor';
export { FindingsPanel } from './components/FindingsPanel';
export { LiteratureTable } from './components/LiteratureTable';
export { DocumentUploader } from './components/DocumentUploader';
export { MayaAssistantPanel } from './components/MayaAssistantPanel';
export { ResearchImpactPanel } from './components/ResearchImpactPanel';
export { ProblemDefinitionForm } from './components/ProblemDefinitionForm';
export { GateApprovalPanel } from './components/GateApprovalPanel';

export {
  summarizeResearch,
  generateInsights,
  detectKnowledgeGaps,
  suggestResearchQuestions,
} from './ai/mayaResearchAI';
export { evaluateGate, canAuthorizePrototype } from './ai/gateEngine';
