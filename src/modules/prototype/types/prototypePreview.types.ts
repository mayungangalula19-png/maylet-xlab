export type ReviewDecision = 'pending' | 'approved' | 'changes_requested';

export interface PrototypeReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  decision: ReviewDecision;
  createdAt: string;
}

export type ReadinessSignal = 'green' | 'yellow' | 'red';

export interface CommercialReadiness {
  market: ReadinessSignal;
  scalability: ReadinessSignal;
  funding: ReadinessSignal;
  risk: ReadinessSignal;
  marketScore: number;
  scalabilityScore: number;
  fundingScore: number;
  riskScore: number;
}

export const PREVIEW_SECTIONS: { id: string; label: string }[] = [
  { id: 'showcase', label: 'Visuals' },
  { id: 'summary', label: 'Summary' },
  { id: 'problem', label: 'Problem' },
  { id: 'solution', label: 'Solution' },
  { id: 'flow', label: 'User flow' },
  { id: 'features', label: 'Features' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'validation', label: 'Validation' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'docs', label: 'Docs' },
  { id: 'attachments', label: 'Files' },
  { id: 'review', label: 'Review' },
  { id: 'activity', label: 'Activity' },
];

export function newReviewId(): string {
  return crypto.randomUUID();
}
