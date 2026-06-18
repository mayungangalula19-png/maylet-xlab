import { memo } from 'react';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { AdminDataTable } from '../../components/tables/AdminDataTable';
import type { Mentor } from '../types/mentorOps.types';
import { formatAdminDate } from '../../utils/adminPage.utils';

export type MentorRowAction =
  | 'view'
  | 'edit'
  | 'suspend'
  | 'activate'
  | 'assign'
  | 'schedule';

interface MentorTableProps {
  mentors: Mentor[];
  selectedId: string | null;
  actionLoading: string | null;
  onSelect: (id: string) => void;
  onAction: (mentor: Mentor, action: MentorRowAction) => void;
}

function availabilityVariant(av: Mentor['availability']) {
  switch (av) {
    case 'available':
      return 'success' as const;
    case 'busy':
      return 'warning' as const;
    case 'away':
      return 'info' as const;
    default:
      return 'default' as const;
  }
}

export const MentorTable = memo(function MentorTable({
  mentors,
  selectedId,
  actionLoading,
  onSelect,
  onAction,
}: MentorTableProps) {
  return (
    <AdminDataTable
      empty={mentors.length === 0}
      emptyTitle="No mentors found"
      emptyMessage="Mentors from the directory and profiles with role mentor appear here."
      minWidth={1100}
    >
      <thead>
        <tr>
          <th>Mentor</th>
          <th>Organization</th>
          <th>Position</th>
          <th>Expertise</th>
          <th>Industry</th>
          <th>Exp.</th>
          <th>Country</th>
          <th>Availability</th>
          <th>Rating</th>
          <th>Mentees</th>
          <th>Last Session</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {mentors.map((m) => (
          <tr
            key={m.id}
            className={selectedId === m.id ? 'admin-table-row--selected' : ''}
            onClick={() => onSelect(m.id)}
          >
            <td>
              <div className="admin-mentor-table-name">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="" className="admin-mentor-avatar-img" />
                ) : (
                  <span className="admin-mentor-avatar-sm">{m.name.slice(0, 2).toUpperCase()}</span>
                )}
                <span>
                  <strong>{m.name}</strong>
                  {m.status === 'suspended' ? (
                    <AdminBadge variant="danger">Suspended</AdminBadge>
                  ) : null}
                </span>
              </div>
            </td>
            <td>{m.organization ?? '—'}</td>
            <td>{m.position}</td>
            <td>
              <div className="admin-mentor-tags">
                {m.expertise.slice(0, 2).map((e) => (
                  <span key={e} className="admin-mentor-tag">{e}</span>
                ))}
              </div>
            </td>
            <td>{m.industry ?? '—'}</td>
            <td>{m.experienceYears}y</td>
            <td>{m.country ?? '—'}</td>
            <td>
              <AdminBadge variant={availabilityVariant(m.availability)}>{m.availability}</AdminBadge>
            </td>
            <td>{m.rating.toFixed(1)}</td>
            <td>{m.activeMentees}</td>
            <td>{m.lastSessionDate ? formatAdminDate(m.lastSessionDate) : '—'}</td>
            <td onClick={(e) => e.stopPropagation()}>
              <div className="admin-row-actions">
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" disabled={actionLoading === m.id} onClick={() => onAction(m, 'view')}>View</button>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" disabled={actionLoading === m.id} onClick={() => onAction(m, 'assign')}>Assign</button>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" disabled={actionLoading === m.id} onClick={() => onAction(m, 'schedule')}>Schedule</button>
                {m.status === 'active' ? (
                  <button type="button" className="admin-btn admin-btn--danger admin-btn--xs" disabled={actionLoading === m.id} onClick={() => onAction(m, 'suspend')}>Suspend</button>
                ) : (
                  <button type="button" className="admin-btn admin-btn--primary admin-btn--xs" disabled={actionLoading === m.id} onClick={() => onAction(m, 'activate')}>Activate</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminDataTable>
  );
});
