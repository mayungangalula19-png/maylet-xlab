import { memo, useEffect, useState } from 'react';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminBadge } from '../../components/ui/AdminBadge';
import {
  fetchInnovatorActivity,
  fetchInnovatorReviews,
} from '../services/innovators.service';
import type {
  Innovator,
  InnovatorActivity,
  InnovatorReview,
  ReviewFormValues,
} from '../types/innovatorOps.types';
import { computeFinalScore, priorityColor, stageLabel } from '../types/innovatorOps.types';
import { formatAdminDateTime } from '../../utils/adminPage.utils';

interface InnovatorProfileDrawerProps {
  innovator: Innovator | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmitReview: (values: ReviewFormValues) => Promise<void>;
  onLogContact: (nextFollowUp?: string) => Promise<void>;
}

function ScoreRing({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="admin-innovator-score-ring" style={{ borderColor: color }}>
      <span className="admin-innovator-score-value">{value}</span>
      <span className="admin-innovator-score-label">{label}</span>
    </div>
  );
}

export const InnovatorProfileDrawer = memo(function InnovatorProfileDrawer({
  innovator,
  open,
  saving,
  onClose,
  onSubmitReview,
  onLogContact,
}: InnovatorProfileDrawerProps) {
  const [reviews, setReviews] = useState<InnovatorReview[]>([]);
  const [activity, setActivity] = useState<InnovatorActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [form, setForm] = useState<ReviewFormValues>({
    impactScore: 70,
    feasibilityScore: 65,
    marketScore: 60,
    notes: '',
    decision: 'pending',
  });

  useEffect(() => {
    if (!open || !innovator) return;
    setFeedback(null);
    setForm({
      impactScore: innovator.impactScore || 70,
      feasibilityScore: innovator.feasibilityScore || 65,
      marketScore: innovator.marketScore || 60,
      notes: '',
      decision: 'pending',
    });
    setLoading(true);
    void Promise.all([
      fetchInnovatorReviews(innovator.id),
      fetchInnovatorActivity(innovator.id),
    ]).then(([rev, act]) => {
      setReviews(rev.data ?? []);
      setActivity(act.data ?? []);
      setLoading(false);
    });
  }, [open, innovator]);

  if (!open || !innovator) return null;

  const previewFinal = computeFinalScore(form.impactScore, form.feasibilityScore, form.marketScore);

  const handleReview = async (decision: ReviewFormValues['decision']) => {
    setFeedback(null);
    try {
      await onSubmitReview({ ...form, decision });
      setFeedback(
        decision === 'approve'
          ? 'Innovator approved — scores updated live.'
          : decision === 'reject'
            ? 'Innovator rejected.'
            : 'Revision requested — moved back to Idea Submitted.'
      );
      setForm((f) => ({ ...f, notes: '' }));
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Review failed');
    }
  };

  return (
    <div
      className="admin-drawer-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-drawer admin-drawer--wide admin-innovator-drawer">
        <div className="admin-drawer-header">
          <div>
            <h3>{innovator.fullName}</h3>
            <p className="admin-muted">
              {innovator.email}
              {innovator.phone ? ` · ${innovator.phone}` : ''}
              {' · '}
              {innovator.organization ?? 'Independent'}
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={onClose}>
            ✕
          </button>
        </div>

        {feedback ? (
          <div className={`admin-alert ${feedback.includes('failed') ? 'admin-alert--danger' : 'admin-alert--success'}`}>
            {feedback}
          </div>
        ) : null}

        <section className="admin-innovator-drawer-section">
          <h4>{innovator.ideaTitle}</h4>
          <p className="admin-innovator-drawer-desc">
            {innovator.ideaDescription || 'No description provided.'}
          </p>
          <div className="admin-innovator-drawer-score-rings">
            <ScoreRing label="Impact" value={innovator.impactScore} color="#7c5fe6" />
            <ScoreRing label="Feasibility" value={innovator.feasibilityScore} color="#2fd4ff" />
            <ScoreRing label="Market" value={innovator.marketScore} color="#f6c90e" />
            <ScoreRing label="Final" value={innovator.finalScore} color="#48bb78" />
          </div>
          <div className="admin-innovator-drawer-badges">
            <AdminBadge variant="info">{stageLabel(innovator.stage)}</AdminBadge>
            <span style={{ color: priorityColor(innovator.priority) }}>{innovator.priority} priority</span>
            <span className="admin-muted">{innovator.category}</span>
          </div>
          <div className="admin-innovator-contact-row">
            <label>
              Next follow-up
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--xs"
              disabled={saving}
              onClick={() => void onLogContact(nextFollowUp || undefined)}
            >
              {saving ? 'Saving…' : 'Log contact'}
            </button>
          </div>
        </section>

        <section className="admin-innovator-drawer-section">
          <h4>Review &amp; Evaluation</h4>
          <div className="admin-innovator-review-form">
            {(['impactScore', 'feasibilityScore', 'marketScore'] as const).map((key, i) => {
              const labels = ['Impact', 'Feasibility', 'Market potential'];
              return (
                <label key={key}>
                  {labels[i]} (0–100)
                  <div className="admin-innovator-range-row">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    />
                    <span>{form[key]}</span>
                  </div>
                </label>
              );
            })}
            <p className="admin-innovator-preview-score">
              Live preview final score: <strong>{previewFinal}</strong>
            </p>
            <label>
              Reviewer notes
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <div className="admin-innovator-review-actions">
              <button type="button" className="admin-btn admin-btn--primary admin-btn--xs" disabled={saving} onClick={() => void handleReview('approve')}>
                {saving ? 'Saving…' : 'Approve'}
              </button>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" disabled={saving} onClick={() => void handleReview('request_revision')}>
                Request Revision
              </button>
              <button type="button" className="admin-btn admin-btn--danger admin-btn--xs" disabled={saving} onClick={() => void handleReview('reject')}>
                Reject
              </button>
            </div>
          </div>
        </section>

        <section className="admin-innovator-drawer-section">
          <h4>Review History ({reviews.length})</h4>
          {loading ? (
            <AdminLoadingState label="Loading…" compact />
          ) : reviews.length === 0 ? (
            <p className="admin-muted">No reviews yet.</p>
          ) : (
            <ul className="admin-innovator-review-list">
              {reviews.slice(0, 5).map((rev) => (
                <li key={rev.id} className="admin-innovator-review-item">
                  <div className="admin-innovator-review-item-head">
                    <strong>{rev.reviewerName}</strong>
                    <span className="admin-muted">{formatAdminDateTime(rev.createdAt)}</span>
                  </div>
                  <span className="admin-innovator-review-decision">{rev.decision.replace(/_/g, ' ')}</span>
                  <span className="admin-muted">
                    I {rev.impactScore} · F {rev.feasibilityScore} · M {rev.marketScore}
                  </span>
                  {rev.notes ? <p>{rev.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-innovator-drawer-section">
          <h4>Engagement Timeline</h4>
          {loading ? (
            <AdminLoadingState label="Loading…" compact />
          ) : (
            <>
              <p className="admin-muted">
                Last contact {formatAdminDateTime(innovator.lastContactedAt)}
                {innovator.nextFollowUpDate ? ` · Next ${innovator.nextFollowUpDate}` : ''}
              </p>
              <ul className="admin-innovator-activity-list">
                {activity.slice(0, 10).map((ev) => (
                  <li key={ev.id}>
                    <span className="admin-muted">{formatAdminDateTime(ev.createdAt)}</span>
                    <span>{ev.action.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
});
