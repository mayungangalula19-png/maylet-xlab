export type GateDecision = 'go' | 'conditional_go' | 'hold' | 'no_go' | 'pending';

export type GateCheckStatus = 'pass' | 'fail' | 'pending' | 'na';

export interface GateCheckItem {
  id: string;
  label: string;
  status: GateCheckStatus;
  detail?: string;
  auto?: boolean;
}

export interface GateEvaluation {
  systemCompletion: number;
  sectionA: GateCheckItem[];
  sectionB: GateCheckItem[];
  sectionC: GateCheckItem[];
  recommendedDecision: GateDecision;
  blockers: string[];
  warnings: string[];
  prototypeAuthorized: boolean;
}

export interface GateReviewRecord {
  id: string;
  project_id: string;
  user_id: string;
  system_completion: number;
  section_a: GateCheckItem[];
  section_b: GateCheckItem[];
  section_c: GateCheckItem[];
  decision: GateDecision;
  v1_scope: string | null;
  out_of_scope: string | null;
  open_risks: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GateReviewInput {
  sectionB: GateCheckItem[];
  sectionC: GateCheckItem[];
  decision: GateDecision;
  v1Scope: string;
  outOfScope: string;
  openRisks: string;
  reviewerName: string;
}

export const GATE_DECISION_LABELS: Record<GateDecision, string> = {
  go: 'GO — Authorized for Prototype',
  conditional_go: 'Conditional GO — Limited Prototype Scope',
  hold: 'HOLD — Continue Research',
  no_go: 'NO-GO — Do Not Prototype',
  pending: 'Pending Review',
};
