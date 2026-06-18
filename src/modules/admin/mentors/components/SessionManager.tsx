import { memo, useEffect, useState } from 'react';
import type { MentorSession, SessionFormValues, SessionStatus } from '../types/mentorOps.types';
import { sessionStatusLabel } from '../types/mentorOps.types';
import { formatAdminDateTime } from '../../utils/adminPage.utils';

interface SessionManagerProps {
  sessions: MentorSession[];
  mentorId?: string;
  innovatorOptions: { id: string; name: string }[];
  saving?: boolean;
  onSchedule: (values: SessionFormValues) => Promise<void>;
}

export const SessionManager = memo(function SessionManager({
  sessions,
  mentorId,
  innovatorOptions,
  saving,
  onSchedule,
}: SessionManagerProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SessionFormValues>({
    mentorId: mentorId ?? '',
    innovatorId: innovatorOptions[0]?.id ?? '',
    sessionDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 60,
    notes: '',
    status: 'scheduled',
  });

  useEffect(() => {
    if (mentorId) setForm((f) => ({ ...f, mentorId }));
  }, [mentorId]);

  return (
    <section className="admin-mentor-sessions">
      <div className="admin-mentor-section-head">
        <h4>Session Management</h4>
        {mentorId ? (
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={() => setOpen(!open)}>
            {open ? 'Cancel' : '+ Schedule Session'}
          </button>
        ) : null}
      </div>

      {open && mentorId ? (
        <form
          className="admin-mentor-session-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSchedule(form).then(() => setOpen(false));
          }}
        >
          <label>
            Innovator
            <select
              value={form.innovatorId}
              onChange={(e) => setForm({ ...form, innovatorId: e.target.value })}
              required
            >
              {innovatorOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
          <label>
            Date &amp; time
            <input
              type="datetime-local"
              value={form.sessionDate}
              onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
              required
            />
          </label>
          <label>
            Duration (min)
            <input
              type="number"
              min={15}
              step={15}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as SessionStatus })}
            >
              {(['scheduled', 'completed', 'missed', 'rescheduled', 'cancelled'] as SessionStatus[]).map((s) => (
                <option key={s} value={s}>{sessionStatusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <button type="submit" className="admin-btn admin-btn--primary admin-btn--xs" disabled={saving}>
            {saving ? 'Saving…' : 'Create Session'}
          </button>
        </form>
      ) : null}

      <ul className="admin-mentor-session-list">
        {(mentorId ? sessions.filter((s) => s.mentorId === mentorId) : sessions).slice(0, 8).map((s) => (
          <li key={s.id} className="admin-mentor-session-item">
            <div className="admin-mentor-session-head">
              <strong>{s.innovatorName}</strong>
              <span className={`admin-session-status admin-session-status--${s.status}`}>
                {sessionStatusLabel(s.status)}
              </span>
            </div>
            <span className="admin-muted">{formatAdminDateTime(s.sessionDate)} · {s.durationMinutes} min</span>
            {s.notes ? <p>{s.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
});
