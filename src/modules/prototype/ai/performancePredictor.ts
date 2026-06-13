import type { PrototypeRecord } from '../types/prototype.types';

export interface PerformanceForecast {
  readinessScore: number;
  estimatedStability: 'low' | 'medium' | 'high';
  bottlenecks: string[];
}

export function predictPerformance(prototype: PrototypeRecord): PerformanceForecast {
  const bottlenecks: string[] = [];
  let readiness = 50;

  if (prototype.file_url) readiness += 15;
  if (prototype.lifecycle_status === 'testing') readiness += 10;
  if (prototype.lifecycle_status === 'success') readiness += 25;
  if (prototype.lifecycle_status === 'failed') readiness -= 30;
  if (!prototype.project_id) bottlenecks.push('Not linked to a project');
  if (prototype.views < 5) bottlenecks.push('Low preview engagement — gather feedback');

  readiness = Math.min(100, Math.max(0, readiness));

  const estimatedStability: PerformanceForecast['estimatedStability'] =
    readiness >= 75 ? 'high' : readiness >= 45 ? 'medium' : 'low';

  return { readinessScore: readiness, estimatedStability, bottlenecks };
}

export function predictFailurePoints(prototype: PrototypeRecord): string[] {
  const points: string[] = [];
  if (!prototype.file_url) points.push('Missing deployable artifact');
  if (prototype.lifecycle_status === 'draft') points.push('No build executed yet');
  if (prototype.lifecycle_status === 'building') points.push('Build in progress — failure possible');
  return points;
}
