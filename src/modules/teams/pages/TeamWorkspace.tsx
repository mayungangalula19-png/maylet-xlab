// C:\Users\user\maylet-xlab\src\app\routes\TeamWorkspace.tsx
// ADVANCED TEAM WORKSPACE – Manage team, members, projects, activities, real-time

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Team {
  id: string;
  name: string;
  description: string;
  purpose: string;
  created_at: string;
  updated_at: string;
  user_id: string; // creator/owner
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
}

interface TeamProject {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  created_at: string;
}

interface TeamActivity {
  id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

// ============================================================
// TEAM WORKSPACE COMPONENT
// ============================================================
const TeamWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const fetchTeamData = useCallback(async () => {
    if (!id) return;
    try {
      // Get team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();
      if (teamError || !teamData) {
        navigate('/teams');
        return;
      }
      setTeam(teamData);
      setEditName(teamData.name);
      setEditDesc(teamData.description || '');
      setEditPurpose(teamData.purpose || '');

      // Get members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*, user_profile:profiles(full_name, avatar_url, email)')
        .eq('team_id', id);
      if (!membersError) setMembers(membersData as TeamMember[]);

      // Determine current user's role
      const myMember = membersData?.find(m => m.user_id === currentUserId);
      setUserRole(myMember?.role || null);

      // Get projects associated with this team (assuming projects have team_id column)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description, status, progress, created_at')
        .eq('team_id', id)
        .order('created_at', { ascending: false });
      if (!projectsError) setProjects(projectsData || []);

      // Get team activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('team_activities')
        .select('*')
        .eq('team_id', id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (!activitiesError) setActivities(activitiesData || []);

    } catch (err) {
      console.error(err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, currentUserId]);

  useEffect(() => {
    if (currentUserId) fetchTeamData();
  }, [currentUserId, fetchTeamData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!id) return;
    const membersChannel = supabase
      .channel(`team_members_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${id}` }, () => fetchTeamData())
      .subscribe();
    const activitiesChannel = supabase
      .channel(`team_activities_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_activities', filter: `team_id=eq.${id}` }, () => fetchTeamData())
      .subscribe();
    const projectsChannel = supabase
      .channel(`projects_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `team_id=eq.${id}` }, () => fetchTeamData())
      .subscribe();
    return () => {
      membersChannel.unsubscribe();
      activitiesChannel.unsubscribe();
      projectsChannel.unsubscribe();
    };
  }, [id, fetchTeamData]);

  const handleUpdateTeam = async () => {
    if (!team) return;
    const { error } = await supabase
      .from('teams')
      .update({
        name: editName,
        description: editDesc,
        purpose: editPurpose,
        updated_at: new Date().toISOString(),
      })
      .eq('id', team.id);
    if (error) setError('Update failed');
    else {
      setTeam({ ...team, name: editName, description: editDesc, purpose: editPurpose });
      setEditingTeam(false);
      setSuccess('Team updated');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();
      if (userError || !userData) {
        setError('User not found. They need to register first.');
        return;
      }
      const { error: insertError } = await supabase.from('team_members').insert({
        team_id: team!.id,
        user_id: userData.id,
        role: inviteRole,
        joined_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      setInviteEmail('');
      setSuccess(`Invited ${inviteEmail} as ${inviteRole}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (newRole === 'owner') return; // cannot assign owner
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) setError('Role update failed');
  };

  const handleRemoveMember = async (memberId: string, userIdToRemove: string) => {
    if (userIdToRemove === currentUserId) {
      setError('You cannot remove yourself. Transfer ownership first.');
      return;
    }
    if (window.confirm('Remove this member from the team?')) {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) setError('Remove failed');
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Delete this team permanently? All projects and data will be disassociated.')) return;
    const { error } = await supabase.from('teams').delete().eq('id', team!.id);
    if (error) setError('Delete failed');
    else navigate('/teams');
  };

  const canEditTeam = userRole === 'owner' || userRole === 'admin';
  const canInvite = canEditTeam;
  const canManageMembers = canEditTeam;

  if (loading) {
    return (
      <div className="team-workspace-container">
        <main className="workspace-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="team-workspace-container">
      <main className="workspace-main">
        <div className="workspace-header">
          <Link to="/teams" className="back-link">← Back to Teams</Link>
          {canEditTeam && (
            <button onClick={handleDeleteTeam} className="btn-delete-team">Delete Team</button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="team-header">
          {editingTeam ? (
            <div className="edit-team-form">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Team Name" />
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" rows={2} />
              <textarea value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} placeholder="Purpose" rows={2} />
              <div className="edit-actions">
                <button onClick={() => setEditingTeam(false)}>Cancel</button>
                <button onClick={handleUpdateTeam}>Save</button>
              </div>
            </div>
          ) : (
            <div>
              <h1>{team.name}</h1>
              <p className="team-description">{team.description || 'No description'}</p>
              <p className="team-purpose"><strong>Purpose:</strong> {team.purpose || 'Not specified'}</p>
              {canEditTeam && <button onClick={() => setEditingTeam(true)} className="btn-edit-team">✏️ Edit Team</button>}
            </div>
          )}
        </div>

        <div className="workspace-grid">
          {/* Members Section */}
          <div className="card members-card">
            <h2>Team Members</h2>
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-avatar">
                    {member.user_profile?.avatar_url ? (
                      <img loading="lazy" decoding="async" src={member.user_profile.avatar_url} alt="" />
                    ) : (
                      <span>{member.user_profile?.full_name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="member-details">
                    <div>{member.user_profile?.full_name || 'Unknown'}</div>
                    <div className="member-role">{member.role}</div>
                  </div>
                  {canManageMembers && member.role !== 'owner' && (
                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button onClick={() => handleRemoveMember(member.id, member.user_id)}>Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {canInvite && (
              <div className="invite-section">
                <h3>Invite Member</h3>
                <div className="invite-form">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                  <button onClick={handleInvite} disabled={inviting}>
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="card projects-card">
            <h2>Team Projects</h2>
            {projects.length === 0 ? (
              <p className="empty-message">No projects yet. Create a project and assign it to this team.</p>
            ) : (
              <div className="projects-list">
                {projects.map((proj) => (
                  <Link key={proj.id} to={`/projects/${proj.id}`} className="project-item">
                    <div>
                      <strong>{proj.name}</strong>
                      <p>{proj.description?.substring(0, 60)}</p>
                    </div>
                    <div className="project-meta">
                      <span className={`status-${proj.status}`}>{proj.status}</span>
                      <span>Progress: {proj.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {canEditTeam && (
              <Link to="/projects?create=1" state={{ prefillTeamId: team.id }} className="btn-create-project">
                + Create New Project
              </Link>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card activity-card">
          <h2>Recent Activity</h2>
          <div className="activity-feed">
            {activities.length === 0 ? (
              <p>No activity yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="activity-item">
                  <strong>{act.user_name}</strong> {act.action} {act.details}
                  <span className="activity-time">{new Date(act.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <style>{`
        .team-workspace-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .workspace-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .workspace-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .back-link {
          color: #7c5fe6;
          text-decoration: none;
        }
        .btn-delete-team {
          background: rgba(252,129,129,0.2);
          border: none;
          padding: 0.3rem 0.8rem;
          border-radius: 30px;
          color: #fc8181;
          cursor: pointer;
        }
        .team-header {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .team-header h1 {
          margin: 0 0 0.5rem;
        }
        .team-description, .team-purpose {
          color: rgba(255,255,255,0.7);
          margin: 0.25rem 0;
        }
        .btn-edit-team {
          background: rgba(124,95,230,0.2);
          border: none;
          padding: 0.3rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .edit-team-form input, .edit-team-form textarea {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.6rem;
          color: white;
          margin-bottom: 0.5rem;
        }
        .edit-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        .workspace-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 900px) {
          .workspace-grid {
            grid-template-columns: 1fr;
          }
        }
        .card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.5rem;
        }
        .members-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .member-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .member-avatar {
          width: 36px;
          height: 36px;
          background: #7c5fe6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .member-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .member-details {
          flex: 1;
        }
        .member-role {
          font-size: 0.7rem;
          color: #2fd4ff;
        }
        .member-actions {
          display: flex;
          gap: 0.5rem;
        }
        .invite-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .invite-form {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .invite-form input {
          flex: 1;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          padding: 0.5rem;
          color: white;
        }
        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .project-item {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 0.75rem;
          text-decoration: none;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .project-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.7rem;
        }
        .status-draft { color: #f6c90e; }
        .status-active { color: #2fd4ff; }
        .status-completed { color: #48bb78; }
        .btn-create-project {
          display: block;
          text-align: center;
          margin-top: 1rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.4rem;
          border-radius: 30px;
          text-decoration: none;
          color: #0a0d1a;
          font-weight: 600;
        }
        .activity-feed {
          max-height: 300px;
          overflow-y: auto;
        }
        .activity-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 0.8rem;
        }
        .activity-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          margin-left: 1rem;
        }
        .error-banner, .success-banner {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.5rem;
          margin-bottom: 1rem;
        }
        .success-banner {
          background: rgba(72,187,120,0.2);
          border-color: #48bb78;
          color: #48bb78;
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TeamWorkspace;