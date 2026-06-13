import { analyzePrototypeRisk, type PrototypeAiInput } from './prototypeAI.engine';
import type { PrototypeAiEvaluation } from '../types/prototype.types';

export interface PrototypeRecommendation {
  evaluation: PrototypeAiEvaluation;
  readinessScore: number;
  nextAction: string;
}

export function getPrototypeRecommendation(input: PrototypeAiInput): PrototypeRecommendation {
  const evaluation = analyzePrototypeRisk(input);
  const readinessScore = Math.max(0, 100 - evaluation.riskScore);

  let nextAction = 'Continue building and upload a testable artifact';
  if (evaluation.recommendation === 'APPROVE') {
    nextAction = 'Promote to Project — prototype is validated';
  } else if (input.prototype.lifecycle_status === 'testing') {
    nextAction = 'Complete test runs and document results';
  } else if (input.prototype.lifecycle_status === 'building') {
    nextAction = 'Finish build and move to testing';
  } else if (!input.prototype.file_url) {
    nextAction = 'Upload a build (ZIP, APK, or docs) before testing';
  } else if (evaluation.recommendation === 'REJECT') {
    nextAction = 'Address failure points before re-testing';
  }

  return { evaluation, readinessScore, nextAction };
}
