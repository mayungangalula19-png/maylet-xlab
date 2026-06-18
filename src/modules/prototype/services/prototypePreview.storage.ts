import type { PrototypeReview } from '../types/prototypePreview.types';

const PREFIX = 'maylet-proto-reviews:';

export function loadReviews(prototypeId: string): PrototypeReview[] {
  try {
    const raw = localStorage.getItem(`${PREFIX}${prototypeId}`);
    if (!raw) return [];
    return JSON.parse(raw) as PrototypeReview[];
  } catch {
    return [];
  }
}

export function saveReviews(prototypeId: string, reviews: PrototypeReview[]): void {
  localStorage.setItem(`${PREFIX}${prototypeId}`, JSON.stringify(reviews));
}

export function addReview(prototypeId: string, review: PrototypeReview): PrototypeReview[] {
  const next = [review, ...loadReviews(prototypeId)];
  saveReviews(prototypeId, next);
  return next;
}
