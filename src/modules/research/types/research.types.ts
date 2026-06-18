export type LiteratureType = 'paper' | 'journal' | 'white_paper' | 'report' | 'reference';
export type FindingType = 'finding' | 'observation' | 'insight' | 'conclusion';

export interface ResearchProfile {
  id: string;
  project_id: string;
  user_id: string;
  problem_statement: string | null;
  target_users: string | null;
  pain_points: string | null;
  existing_solutions: string | null;
  research_questions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchNote {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LiteratureItem {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  item_type: LiteratureType;
  source: string | null;
  authors: string | null;
  publication_date: string | null;
  citation_count: number | null;
  relevance_score: number | null;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchFinding {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  finding_type: FindingType;
  created_at: string;
  updated_at: string;
}

export interface ResearchDocument {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  file_url: string | null;
  file_type: string | null;
  size_bytes: number | null;
  category: string | null;
  tags: string[] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchDashboardStats {
  researchProjects: number;
  notes: number;
  literatureReviews: number;
  papers: number;
  documents: number;
  knowledgeAssets: number;
  completionRate: number;
}

export interface ProjectResearchSnapshot {
  profile: ResearchProfile | null;
  notes: ResearchNote[];
  literature: LiteratureItem[];
  findings: ResearchFinding[];
  documents: ResearchDocument[];
  completionRate: number;
}

export interface ResearchProjectSummary {
  id: string;
  name: string;
  sector: string;
  completionRate: number;
  notesCount?: number;
  findingsCount?: number;
  literatureCount?: number;
  documentsCount?: number;
}

export interface ResearchActivityPoint {
  date: string;
  count: number;
}

export type ResearchWorkspaceTab =
  | 'overview'
  | 'forms'
  | 'notes'
  | 'problem'
  | 'findings'
  | 'literature'
  | 'documents'
  | 'maya'
  | 'analytics'
  | 'impact'
  | 'gate';

export const NOTE_CATEGORIES = [
  'general',
  'fieldwork',
  'interview',
  'methodology',
  'data',
  'meeting',
] as const;

export const LITERATURE_TYPE_LABELS: Record<LiteratureType, string> = {
  paper: 'Research Paper',
  journal: 'Journal Article',
  white_paper: 'White Paper',
  report: 'Report',
  reference: 'Reference',
};

export const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  finding: 'Key Finding',
  observation: 'Observation',
  insight: 'Insight',
  conclusion: 'Conclusion',
};

/** AI impact engine types */
export interface ResearchImpactAction {
  id: string;
  type: 'status' | 'priority' | 'task' | 'risk' | 'timeline';
  title: string;
  detail: string;
  confidence: number;
}

export interface ResearchImpactResult {
  researchId: string;
  impactedProjects: { projectId: string; projectName: string; reason: string }[];
  suggestedActions: ResearchImpactAction[];
  riskChanges: { projectId: string; from: string; to: string; reason: string }[];
  priorityAdjustments: { projectId: string; suggestion: string; reason: string }[];
}

export interface ProjectRecommendation {
  nextSteps: string[];
  taskSuggestions: string[];
  timelineChanges: string[];
  riskScore: number | null;
  explanation: string;
}
