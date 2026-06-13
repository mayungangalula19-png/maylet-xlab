export type ValidationDecision = 'pass' | 'hold' | 'fail' | 'pending';

export interface ValidationScores {
  technical: number;
  user: number;
  market: number;
  financial: number;
  overall: number;
}

export interface ValidationEvidenceSummary {
  projectId: string;
  projectName: string;
  research: {
    findingsCount: number;
    notesCount: number;
    documentsCount: number;
    literatureCount: number;
    interviewNotesCount: number;
    completionPct: number;
  };
  prototypes: {
    count: number;
    successCount: number;
    withBuildCount: number;
    avgTestPassRate: number;
  };
  experiments: {
    count: number;
    completedCount: number;
    withResultsCount: number;
    marketTypeCount: number;
    userTypeCount: number;
  };
}

export interface ValidationMayaInsight {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ValidationRecord {
  id: string;
  project_id: string;
  user_id: string;
  project_name?: string;
  scores: ValidationScores;
  decision: ValidationDecision;
  evidence: ValidationEvidenceSummary;
  maya_insights: ValidationMayaInsight[];
  reviewer_notes: string | null;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationDashboardStats {
  total: number;
  pass: number;
  hold: number;
  fail: number;
  pending: number;
  avgReadiness: number;
}

export interface ValidationEvaluationInput {
  evidence: ValidationEvidenceSummary;
  projectProgress: number;
  projectStatus: string;
}

export interface ValidationEvaluationResult {
  scores: ValidationScores;
  decision: ValidationDecision;
  maya_insights: ValidationMayaInsight[];
  summary: string;
}
