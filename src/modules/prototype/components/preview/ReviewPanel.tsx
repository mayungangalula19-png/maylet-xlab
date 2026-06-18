import { type FormEvent, useState } from 'react';
import type { PrototypeReview, ReviewDecision } from '../../types/prototypePreview.types';

interface Props {
  reviews: PrototypeReview[];
  avgRating: number | null;
  canReview?: boolean;
  onSubmit: (payload: { rating: number; comment: string; decision: ReviewDecision }) => void;
}

export function ReviewPanel({ reviews, avgRating, canReview = true, onSubmit }: Props) {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState<ReviewDecision>('pending');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSubmit({ rating, comment: comment.trim(), decision });
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const approved = reviews.filter((r) => r.decision === 'approved').length;
  const changes = reviews.filter((r) => r.decision === 'changes_requested').length;

  return (
    <section id="proto-preview-review" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Review panel</h2>
        <p>
          {reviews.length} review{reviews.length === 1 ? '' : 's'}
          {avgRating != null ? ` · ${avgRating.toFixed(1)} avg rating` : ''}
          {approved > 0 ? ` · ${approved} approved` : ''}
          {changes > 0 ? ` · ${changes} change requests` : ''}
        </p>
      </header>

      {canReview ? (
        <form className="proto-preview-review-form" onSubmit={handleSubmit}>
          <div className="proto-preview-review-form__rating">
            <label htmlFor="review-rating">Rating (1–5)</label>
            <input
              id="review-rating"
              type="range"
              min={1}
              max={5}
              step={1}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <span>{rating}/5</span>
          </div>
          <div className="proto-field">
            <label htmlFor="review-comment">Feedback</label>
            <textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your evaluation…"
              required
            />
          </div>
          <div className="proto-preview-review-form__decision">
            <label>
              <input type="radio" name="decision" checked={decision === 'approved'} onChange={() => setDecision('approved')} />
              Approve
            </label>
            <label>
              <input
                type="radio"
                name="decision"
                checked={decision === 'changes_requested'}
                onChange={() => setDecision('changes_requested')}
              />
              Request changes
            </label>
            <label>
              <input type="radio" name="decision" checked={decision === 'pending'} onChange={() => setDecision('pending')} />
              Comment only
            </label>
          </div>
          <button type="submit" className="proto-btn proto-btn--primary">
            Submit review
          </button>
          {submitted ? <span className="proto-preview-review-form__success">Review submitted</span> : null}
        </form>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="proto-preview-reviews">
          {reviews.map((r) => (
            <li key={r.id} className={`proto-preview-review-item proto-preview-review-item--${r.decision}`}>
              <div className="proto-preview-review-item__head">
                <strong>{r.author}</strong>
                <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <time>{new Date(r.createdAt).toLocaleString()}</time>
              </div>
              <p>{r.comment}</p>
              <span className="proto-preview-review-item__decision">{r.decision.replace('_', ' ')}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="proto-muted">No reviews yet. Be the first reviewer.</p>
      )}
    </section>
  );
}
