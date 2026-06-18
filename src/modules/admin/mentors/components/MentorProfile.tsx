import { memo, useEffect, useMemo, useState } from 'react';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { MentorMatchingPanel } from './MentorMatchingPanel';
import { SessionManager } from './SessionManager';
import type {
  MatchCandidate,
  Mentor,
  MentorAssignment,
  MentorFeedbackItem,
  MentorSession,
  SessionFormValues,
} from '../types/mentorOps.types';
import { formatAdminDateTime } from '../../utils/adminPage.utils';

type ProfileTab = 'overview' | 'innovators' | 'sessions' | 'performance' | 'feedback' | 'matching';

interface MentorProfileProps {
  mentor: Mentor | null;
  open: boolean;
  detail: {
    assignments: MentorAssignment[];
    sessions: MentorSession[];
    feedback: MentorFeedbackItem[];
  } | null;
  matches: MatchCandidate[];
  saving: boolean;
  onClose: () => void;
  onSuspend: () => Promise<void>;
  onActivate: () => Promise<void>;
  onAssign: (innovatorId: string, matchScore: number) => Promise<void>;
  onSchedule: (values: SessionFormValues) => Promise<void>;
  onAvailabilityChange?: (availability: Mentor['availability']) => Promise<void>;
  initialTab?: ProfileTab;
}

export const MentorProfile = memo(function MentorProfile({
  mentor,
  open,
  detail,
  matches,
  saving,
  onClose,
  onSuspend,
  onActivate,
  onAssign,
  onSchedule,
  onAvailabilityChange,
  initialTab,
}: MentorProfileProps) {
  const [tab, setTab] = useState<ProfileTab>(initialTab ?? 'overview');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, mentor?.id]);

  const innovatorOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const a of detail?.assignments ?? []) {
      map.set(a.innovatorId, { id: a.innovatorId, name: a.innovatorName });
    }
    for (const m of matches) {
      if (!map.has(m.innovatorId)) {
        map.set(m.innovatorId, { id: m.innovatorId, name: m.innovatorName });
      }
    }
    return [...map.values()];
  }, [detail?.assignments, matches]);

  if (!open || !mentor) return null;

  const completionRate =
    detail && detail.sessions.length > 0
      ? Math.round(
          (detail.sessions.filter((s) => s.status === 'completed').length / detail.sessions.length) * 100
        )
      : 0;

  return (
    <div
      className="admin-drawer-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-drawer admin-drawer--wide admin-mentor-profile-drawer">
        <div className="admin-drawer-header">
          <div className="admin-mentor-profile-head">
            {mentor.photoUrl ? (
              <img src={mentor.photoUrl} alt="" className="admin-mentor-profile-photo" />
            ) : (
              <span className="admin-mentor-profile-photo admin-mentor-profile-photo--placeholder">
                {mentor.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <h3>{mentor.name}</h3>
              <p className="admin-muted">{mentor.position} · {mentor.organization ?? 'Independent'}</p>
              <div className="admin-mentor-profile-badges">
                <AdminBadge variant={mentor.status === 'active' ? 'success' : 'danger'}>{mentor.status}</AdminBadge>
                <AdminBadge variant="info">{mentor.availability}</AdminBadge>
                <span>⭐ {mentor.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={onClose}>✕</button>
        </div>

        <div className="admin-mentor-tabs">
          {(['overview', 'innovators', 'sessions', 'performance', 'feedback', 'matching'] as ProfileTab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`admin-mentor-tab ${tab === t ? 'admin-mentor-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <section className="admin-mentor-tab-panel">
            <p>{mentor.bio || 'No bio provided.'}</p>
            <div className="admin-mentor-overview-grid">
              <div><strong>Email</strong> {mentor.email ?? '—'}</div>
              <div><strong>Phone</strong> {mentor.phone ?? '—'}</div>
              <div><strong>Industry</strong> {mentor.industry ?? '—'}</div>
              <div><strong>Country</strong> {mentor.country ?? '—'}</div>
              <div><strong>Experience</strong> {mentor.experienceYears} years</div>
              <div><strong>Total sessions</strong> {mentor.totalSessions}</div>
            </div>
            <div className="admin-mentor-tags">
              {mentor.expertise.map((e) => (
                <span key={e} className="admin-mentor-tag">{e}</span>
              ))}
            </div>
            <div className="admin-mentor-profile-actions">
              {onAvailabilityChange ? (
                <label className="admin-mentor-availability-select">
                  Availability
                  <select
                    value={mentor.availability}
                    disabled={saving}
                    onChange={(e) => void onAvailabilityChange(e.target.value as Mentor['availability'])}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="away">Away</option>
                    <option value="offline">Offline</option>
                  </select>
                </label>
              ) : null}
              {mentor.status === 'active' ? (
                <button type="button" className="admin-btn admin-btn--danger admin-btn--xs" disabled={saving} onClick={() => void onSuspend()}>Suspend</button>
              ) : (
                <button type="button" className="admin-btn admin-btn--primary admin-btn--xs" disabled={saving} onClick={() => void onActivate()}>Activate</button>
              )}
            </div>
          </section>
        ) : null}

        {tab === 'innovators' ? (
          <section className="admin-mentor-tab-panel">
            {(detail?.assignments ?? []).length === 0 ? (
              <p className="admin-muted">No innovators assigned yet. Use Matching tab to assign.</p>
            ) : (
              <ul className="admin-mentor-assignment-list">
                {(detail?.assignments ?? []).map((a) => (
                  <li key={a.id}>
                    <strong>{a.innovatorName}</strong>
                    <span className="admin-muted">{a.ideaTitle}</span>
                    <span>Match {a.matchScore}% · {a.progressStatus}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'sessions' ? (
          <section className="admin-mentor-tab-panel">
            <SessionManager
              sessions={detail?.sessions ?? []}
              mentorId={mentor.id}
              innovatorOptions={innovatorOptions}
              saving={saving}
              onSchedule={onSchedule}
            />
          </section>
        ) : null}

        {tab === 'performance' ? (
          <section className="admin-mentor-tab-panel">
            <div className="admin-mentor-perf-grid">
              <div className="admin-mentor-perf-card">
                <span>Rating</span>
                <strong>{mentor.rating.toFixed(1)}</strong>
              </div>
              <div className="admin-mentor-perf-card">
                <span>Completion rate</span>
                <strong>{completionRate}%</strong>
              </div>
              <div className="admin-mentor-perf-card">
                <span>Active mentees</span>
                <strong>{mentor.activeMentees}</strong>
              </div>
              <div className="admin-mentor-perf-card">
                <span>Last session</span>
                <strong>{mentor.lastSessionDate ? formatAdminDateTime(mentor.lastSessionDate) : '—'}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'feedback' ? (
          <section className="admin-mentor-tab-panel">
            {(detail?.feedback ?? []).length === 0 ? (
              <p className="admin-muted">No feedback yet.</p>
            ) : (
              <ul className="admin-mentor-feedback-list">
                {(detail?.feedback ?? []).map((f) => (
                  <li key={f.id}>
                    <div className="admin-mentor-feedback-head">
                      <strong>{f.innovatorName}</strong>
                      <span>⭐ {f.rating}</span>
                    </div>
                    <p>{f.comment || 'No comment.'}</p>
                    <span className="admin-muted">{formatAdminDateTime(f.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'matching' ? (
          <section className="admin-mentor-tab-panel">
            <MentorMatchingPanel
              matches={matches}
              actionLoading={saving}
              onAssign={(id, score) => void onAssign(id, score)}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
});
