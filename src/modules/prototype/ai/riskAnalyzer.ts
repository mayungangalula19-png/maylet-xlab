import type { PrototypeRecord } from '../types/prototype.types';
import { analyzePrototypeRisk } from './prototypeAI.engine';

export function scorePrototypeRisk(
  prototype: PrototypeRecord,
  context?: { buildSuccessRate?: number; testPassRate?: number }
): number {
  return analyzePrototypeRisk({ prototype, ...context }).riskScore;
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function riskSummary(prototype: PrototypeRecord): string {
  const score = scorePrototypeRisk(prototype);
  const level = getRiskLevel(score);
  return `${level.toUpperCase()} risk (${score}/100) for ${prototype.name}`;
}
