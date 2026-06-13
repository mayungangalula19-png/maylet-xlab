import type { PrototypeRecord } from '../types/prototype.types';

export interface PrototypeAiInput {
  prototype: PrototypeRecord;
  buildSuccessRate?: number;
  testPassRate?: number;
}

export interface PrototypeAiOutput {
  riskScore: number;
  recommendation: 'APPROVE' | 'HOLD' | 'REJECT';
  improvements: string[];
  failurePoints: string[];
  performanceHints: string[];
  explanation: string;
}

export function analyzePrototypeRisk(input: PrototypeAiInput): PrototypeAiOutput {
  const { prototype, buildSuccessRate = 0.5, testPassRate = 0.5 } = input;
  const improvements: string[] = [];
  const failurePoints: string[] = [];
  const performanceHints: string[] = [];

  let risk = 30;
  if (prototype.lifecycle_status === 'failed') risk += 40;
  if (prototype.lifecycle_status === 'draft') risk += 15;
  if (!prototype.file_url) {
    risk += 20;
    failurePoints.push('No build artifact attached');
  }
  if (!prototype.description?.trim()) {
    risk += 10;
    improvements.push('Add a clear prototype description and success criteria');
  }
  if (buildSuccessRate < 0.6) {
    risk += 15;
    failurePoints.push('Build reliability below threshold');
    performanceHints.push('Stabilize build pipeline before user testing');
  }
  if (testPassRate < 0.5) {
    risk += 20;
    failurePoints.push('Test pass rate is low');
    improvements.push('Address failing test cases before promotion');
  }

  risk = Math.min(100, Math.max(0, risk));

  let recommendation: PrototypeAiOutput['recommendation'] = 'HOLD';
  if (risk <= 35 && prototype.lifecycle_status === 'success') recommendation = 'APPROVE';
  else if (risk >= 70 || prototype.lifecycle_status === 'failed') recommendation = 'REJECT';

  if (recommendation === 'APPROVE') {
    performanceHints.push('Ready for project promotion review');
  } else if (recommendation === 'HOLD') {
    improvements.push('Complete testing cycle and document outcomes');
  }

  return {
    riskScore: risk,
    recommendation,
    improvements,
    failurePoints,
    performanceHints,
    explanation: `Risk ${risk}/100 based on lifecycle (${prototype.lifecycle_status}), builds, and tests.`,
  };
}

export function suggestImprovements(input: PrototypeAiInput): string[] {
  return analyzePrototypeRisk(input).improvements;
}

export function predictFailurePoints(input: PrototypeAiInput): string[] {
  return analyzePrototypeRisk(input).failurePoints;
}

export function optimizePerformance(input: PrototypeAiInput): string[] {
  const base = analyzePrototypeRisk(input).performanceHints;
  if (input.prototype.version === '1.0.0' || input.prototype.version === '1.0') {
    return [...base, 'Introduce semantic versioning after first stable build'];
  }
  return base;
}
