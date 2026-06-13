export type ValidationStage = 'hypothesis' | 'experiment' | 'market' | 'ready_for_funding';

export interface ValidationSummary {
  projectId: string;
  projectName: string;
  stage: ValidationStage;
  score: number;
}
