import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPrototypeRecommendation } from '../ai/recommendationEngine';
import { mergeMetaWithDefaults } from '../services/prototypeCreation.storage';
import { addReview, loadReviews } from '../services/prototypePreview.storage';
import { prototypeService } from '../services/prototypeService';
import { testingService } from '../services/testingService';
import type { PrototypeBuilderMeta } from '../types/prototypeBuilder.types';
import { emptyBuilderMeta } from '../types/prototypeBuilder.types';
import type { PrototypeReview, CommercialReadiness } from '../types/prototypePreview.types';
import type { PrototypeRecord } from '../types/prototype.types';
import { usePrototype } from './usePrototype';

function hydrateMeta(prototype: PrototypeRecord): PrototypeBuilderMeta {
  const stored = mergeMetaWithDefaults(prototype.id, {
    name: prototype.name,
    description: prototype.description ?? '',
    projectId: prototype.project_id ?? '',
    researchId: prototype.research_id ?? prototype.project_id ?? '',
  });
  return { ...emptyBuilderMeta(), ...stored, name: prototype.name };
}

function computeCommercialReadiness(
  meta: PrototypeBuilderMeta,
  readinessScore: number,
  riskScore: number
): CommercialReadiness {
  const signal = (score: number): CommercialReadiness['market'] =>
    score >= 70 ? 'green' : score >= 45 ? 'yellow' : 'red';

  const marketScore = Math.min(
    100,
    (meta.marketNeed.trim() ? 30 : 0) +
      (meta.problemStatement.trim() ? 25 : 0) +
      (meta.targetUsers.trim() ? 20 : 0) +
      (meta.validation.validationScore ?? 0) * 0.25
  );
  const scalabilityScore = Math.min(
    100,
    (meta.infrastructure.trim() ? 25 : 0) +
      (meta.backendStack.trim() ? 25 : 0) +
      (meta.features.filter((f) => f.status === 'tested').length / Math.max(meta.features.length, 1)) * 50
  );
  const fundingScore = Math.round(readinessScore * 0.6 + (meta.validation.validationScore ?? 0) * 0.4);
  const riskScoreNorm = 100 - riskScore;

  return {
    market: signal(marketScore),
    scalability: signal(scalabilityScore),
    funding: signal(fundingScore),
    risk: signal(riskScoreNorm),
    marketScore,
    scalabilityScore,
    fundingScore,
    riskScore: riskScoreNorm,
  };
}

interface Options {
  userId: string | undefined;
  prototypeId: string;
  viewerName?: string;
}

export function usePrototypePreview({ userId, prototypeId, viewerName }: Options) {
  const proto = usePrototype(userId, prototypeId);
  const [reviews, setReviews] = useState<PrototypeReview[]>([]);
  const [viewRecorded, setViewRecorded] = useState(false);

  const meta = useMemo(
    () => (proto.prototype ? hydrateMeta(proto.prototype) : emptyBuilderMeta()),
    [proto.prototype]
  );

  const passRate = useMemo(() => testingService.passRate(proto.tests), [proto.tests]);

  const recommendation = useMemo(() => {
    if (!proto.prototype) return null;
    const buildRate = proto.builds.length
      ? proto.builds.filter((b) => b.status === 'completed').length / proto.builds.length
      : 0;
    return getPrototypeRecommendation({
      prototype: proto.prototype,
      buildSuccessRate: buildRate,
      testPassRate: passRate,
    });
  }, [proto.prototype, proto.builds, passRate]);

  const commercial = useMemo(() => {
    if (!recommendation) return null;
    return computeCommercialReadiness(
      meta,
      recommendation.readinessScore,
      recommendation.evaluation.riskScore
    );
  }, [meta, recommendation]);

  useEffect(() => {
    setReviews(loadReviews(prototypeId));
  }, [prototypeId]);

  useEffect(() => {
    if (!prototypeId || viewRecorded || !proto.prototype) return;
    void prototypeService.incrementViews(prototypeId).catch(() => {});
    setViewRecorded(true);
  }, [prototypeId, viewRecorded, proto.prototype]);

  const submitReview = useCallback(
    (review: Omit<PrototypeReview, 'id' | 'createdAt' | 'author'> & { author?: string }) => {
      const entry: PrototypeReview = {
        id: crypto.randomUUID(),
        author: review.author ?? viewerName ?? 'Reviewer',
        rating: review.rating,
        comment: review.comment,
        decision: review.decision,
        createdAt: new Date().toISOString(),
      };
      const next = addReview(prototypeId, entry);
      setReviews(next);
      return entry;
    },
    [prototypeId, viewerName]
  );

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  return {
    ...proto,
    meta,
    reviews,
    submitReview,
    avgRating,
    passRate,
    recommendation,
    commercial,
  };
}
