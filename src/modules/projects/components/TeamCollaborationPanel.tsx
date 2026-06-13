import { Link } from 'react-router-dom';
import type { TeamMemberPreview } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  members: TeamMemberPreview[];
  pendingInvitations: number;
  collaborationStatus: string;
}

export function TeamCollaborationPanel({
  members,
  pendingInvitations,
  collaborationStatus,
}: Props) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Team Collaboration</h3>
        <Link to="/teams" className="icc-widget-link">Manage Teams</Link>
      </div>
      <Link to="/teams" className="icc-clickable" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ fontSize: '0.72rem', marginBottom: '0.5rem', color: '#2fd4ff' }}>
          {collaborationStatus}
        </div>
      </Link>
      {members.length === 0 ? (
        <>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
            Invite collaborators to accelerate your innovation pipeline.
          </p>
          <Link to="/teams/create" className="icc-widget-cta">
            Invite team member →
          </Link>
        </>
      ) : (
        members.map((m) => (
          <Link key={m.id} to="/teams" className="icc-team-item icc-clickable" title={`View team — ${m.name}`}>
            <strong>{m.name}</strong>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{m.role}</span>
          </Link>
        ))
      )}
      {pendingInvitations > 0 && (
        <Link to="/teams" className="icc-widget-cta" style={{ color: '#f6c90e' }}>
          {pendingInvitations} pending invitation(s) — review →
        </Link>
      )}
    </div>
  );
}
