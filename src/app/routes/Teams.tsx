// C:\Users\user\maylet-xlab\src\app\routes\Teams.tsx
// FULL TEAMS MANAGEMENT PAGE - COMPLETE COLLABORATION SYSTEM
// WITH CREATE TEAM, INVITE MEMBERS, MANAGE ROLES, TEAM ACTIVITIES

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { fetchProjectNames, fetchUserTeamIds } from '../../lib/supabase/dbHelpers';

// ============================================================
// TYPES
// ============================================================
interface Team {
  id: string;
  name: string;
  description: string;
  project_id: string | null;
  project_name?: string;
  owner_id: string;
  owner_name: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  avatar_url?: string;
}

interface TeamActivity {
  id: string;
  team_id: string;
  user_name: string;
  action: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  user_id: string;
}

// ============================================================
// TEAM CARD COMPONENT
// ============================================================
const TeamCard = ({ team, onView, onDelete, isOwner }: { 
  team: Team; 
  onView: (id: string) => void; 
  onDelete: (id: string) => void;
  isOwner: boolean;
}) => {
  return (
    <div className="team-card">
      <div className="team-card-header">
        <div className="team-icon">👥</div>
        <div className="team-info">
          <h3 className="team-name">{team.name}</h3>
          <p className="team-description">{team.description || 'No description'}</p>
        </div>
        {isOwner && <span className="owner-badge">Owner</span>}
      </div>
      
      <div className="team-stats">
        <div className="team-stat">
          <span className="stat-value">{team.member_count}</span>
          <span className="stat-label">Members</span>
        </div>
        <div className="team-stat">
          <span className="stat-value">{team.project_name ? 'Linked' : 'None'}</span>
          <span className="stat-label">Project</span>
        </div>
        <div className="team-stat">
          <span className="stat-value">{new Date(team.created_at).toLocaleDateString()}</span>
          <span className="stat-label">Created</span>
        </div>
      </div>
      
      <div className="team-actions">
        <button onClick={() => onView(team.id)} className="btn-view-team">👁️ View Team</button>
        <button onClick={() => onDelete(team.id)} className="btn-delete-team">🗑️ Delete</button>
      </div>
    </div>
  );
};

// ============================================================
// TEAM DETAIL MODAL COMPONENT
// ============================================================
const TeamDetailModal = ({ team, members, activities, onClose, onInvite, onRemoveMember, onRoleChange, currentUserId }: { 
  team: Team; 
  members: TeamMember[]; 
  activities: TeamActivity[];
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
  onRoleChange: (memberId: string, newRole: string) => void;
  currentUserId: string;
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    await onInvite(inviteEmail, inviteRole);
    setInviteEmail('');
    setShowInvite(false);
    setLoading(false);
  };

  const isOwner = members.find(m => m.user_id === currentUserId)?.role === 'owner';
  const isAdmin = isOwner || members.find(m => m.user_id === currentUserId)?.role === 'admin';

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{team.name}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          {/* Team Info */}
          <div className="team-info-section">
            <p className="team-description-full">{team.description || 'No description provided.'}</p>
            {team.project_name && (
              <div className="team-project">
                <span>📁 Project:</span>
                <Link to={`/projects/${team.project_id}`}>{team.project_name}</Link>
              </div>
            )}
            <div className="team-meta">
              <span>Created by {team.owner_name}</span>
              <span>on {new Date(team.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Members Section */}
          <div className="members-section">
            <div className="section-header">
              <h3>Team Members ({members.length})</h3>
              {(isOwner || isAdmin) && (
                <button onClick={() => setShowInvite(!showInvite)} className="btn-invite">
                  + Invite Member
                </button>
              )}
            </div>

            {showInvite && (
              <div className="invite-form">
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={handleInvite} disabled={loading}>
                  {loading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            )}

            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">
                    {member.full_name?.charAt(0)?.toUpperCase() || '👤'}
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.full_name}
                      {member.user_id === currentUserId && <span className="you-badge">You</span>}
                    </div>
                    <div className="member-email">{member.email}</div>
                  </div>
                  <div className="member-role">
                    {(isOwner || (isAdmin && member.role !== 'owner')) && member.user_id !== currentUserId ? (
                      <select 
                        value={member.role} 
                        onChange={(e) => onRoleChange(member.id, e.target.value)}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`role-badge role-${member.role}`}>
                        {member.role === 'owner' && '👑 Owner'}
                        {member.role === 'admin' && '🛡️ Admin'}
                        {member.role === 'member' && '👤 Member'}
                        {member.role === 'viewer' && '👁️ Viewer'}
                      </span>
                    )}
                  </div>
                  {(isOwner || isAdmin) && member.user_id !== currentUserId && (
                    <button onClick={() => onRemoveMember(member.id)} className="remove-member">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Activities Section */}
          <div className="activities-section">
            <h3>Recent Activity</h3>
            <div className="activities-list">
              {activities.length === 0 ? (
                <p className="no-activities">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">📌</div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{activity.user_name}</strong> {activity.action}
                      </div>
                      <div className="activity-time">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-close">Close</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CREATE TEAM MODAL COMPONENT
// ============================================================
const CreateTeamModal = ({ onClose, onCreate }: { 
  onClose: () => void; 
  onCreate: (name: string, description: string, projectId: string | null) => void;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', session.user.id);
        setProjects((data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          user_id: session.user.id,
        })));

      }
    };
    fetchProjects();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, description, projectId || null);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Team</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Team Name *</label>
            <input
              type="text"
              placeholder="e.g., AI Research Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              placeholder="What is this team for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Link to Project (Optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSubmit} className="btn-create" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DELETE TEAM CONFIRMATION MODAL
// ============================================================
const DeleteTeamModal = ({ teamName, onConfirm, onClose }: { 
  teamName: string; 
  onConfirm: () => void; 
  onClose: () => void;
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content small">
        <div className="modal-header">
          <h3>Delete Team</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <div className="warning-icon">⚠️</div>
          <p>Are you sure you want to delete <strong>"{teamName}"</strong>?</p>
          <p className="warning-text">This action cannot be undone. All team members will lose access.</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={onConfirm} className="btn-confirm-delete">Delete Team</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN TEAMS COMPONENT
// ============================================================
const Teams = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch user info
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      } else {
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);

    try {
      // Get teams where user is a member
      const teamIds = await fetchUserTeamIds(currentUserId);

      if (teamIds.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      // Get team details
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('created_at', { ascending: false });

      const projectIds = (teamsData ?? [])
        .map((team) => team.project_id as string | null)
        .filter(Boolean) as string[];
      const projectNames = await fetchProjectNames(projectIds);

      const ownerIds = [...new Set((teamsData ?? []).map((t) => t.owner_id as string))];
      const { data: owners } = ownerIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', ownerIds)
        : { data: [] };
      const ownerMap = new Map(
        (owners ?? []).map((o) => [
          o.id as string,
          (o.full_name as string) || (o.email as string)?.split('@')[0] || 'Unknown',
        ])
      );

      const formattedTeams: Team[] = (teamsData || []).map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        project_id: team.project_id,
        project_name: team.project_id ? projectNames.get(team.project_id as string) : undefined,
        owner_id: team.owner_id,
        owner_name: ownerMap.get(team.owner_id as string) ?? 'Unknown',
        member_count: 0,
        created_at: team.created_at,
        updated_at: team.updated_at,
      }));

      // Get member count for each team
      for (const team of formattedTeams) {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);
        team.member_count = count || 0;
      }

      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Fetch team details (members and activities)
  const fetchTeamDetails = useCallback(async (teamId: string) => {
    try {
      // Fetch members with profiles
      const { data: membersData } = await supabase
        .from('team_members')
        .select('*, profiles(full_name, email, avatar_url)')
        .eq('team_id', teamId);

      const formattedMembers: TeamMember[] = (membersData || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        full_name: member.profiles?.full_name || 'Unknown',
        email: member.profiles?.email || '',
        role: member.role,
        joined_at: member.joined_at,
        avatar_url: member.profiles?.avatar_url,
      }));

      setTeamMembers(formattedMembers);

      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('team_activities')
        .select('*, profiles(full_name, email)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(20);

      const formattedActivities: TeamActivity[] = (activitiesData ?? []).map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          id: row.id,
          team_id: row.team_id,
          user_name:
            (profile as { full_name?: string; email?: string } | null)?.full_name ||
            (profile as { email?: string } | null)?.email?.split('@')[0] ||
            'Team member',
          action: row.action,
          created_at: row.created_at,
        };
      });

      setTeamActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  }, []);

  // Create team
  const handleCreateTeam = async (name: string, description: string, projectId: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: teamData, error } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          project_id: projectId,
          owner_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('team_members').insert({
        team_id: teamData.id,
        user_id: session.user.id,
        role: 'owner',
      });

      await supabase.from('team_activities').insert({
        team_id: teamData.id,
        user_id: session.user.id,
        action: 'created the team',
      });

      await fetchTeams();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  // Invite member
  const handleInviteMember = async (teamId: string, email: string, role: string) => {
    try {
      // Find user by email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email)
        .single();

      if (!userData) {
        alert('User not found. Make sure they have registered.');
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userData.id)
        .single();

      if (existing) {
        alert('User is already a member of this team');
        return;
      }

      // Add member
      await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: userData.id,
        role: role,
      });

      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('team_activities').insert({
        team_id: teamId,
        user_id: session?.user.id ?? null,
        action: `invited ${userData.full_name || email} as ${role}`,
        details: { invited_user_id: userData.id, role },
      });

      // Refresh team details
      await fetchTeamDetails(teamId);
      await fetchTeams();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member');
    }
  };

  // Remove member
  const handleRemoveMember = async (teamId: string, memberId: string, memberName: string) => {
    try {
      await supabase.from('team_members').delete().eq('id', memberId);

      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('team_activities').insert({
        team_id: teamId,
        user_id: session?.user.id ?? null,
        action: `removed ${memberName} from the team`,
      });

      await fetchTeamDetails(teamId);
      await fetchTeams();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  // Change member role
  const handleRoleChange = async (teamId: string, memberId: string, newRole: string, memberName: string) => {
    try {
      await supabase.from('team_members').update({ role: newRole }).eq('id', memberId);

      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('team_activities').insert({
        team_id: teamId,
        user_id: session?.user.id ?? null,
        action: `changed ${memberName}'s role to ${newRole}`,
        details: { role: newRole },
      });

      await fetchTeamDetails(teamId);
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    try {
      await supabase.from('teams').delete().eq('id', teamId);
      await fetchTeams();
      setShowDeleteModal(null);
      if (selectedTeam?.id === teamId) setSelectedTeam(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  // View team details
  const handleViewTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      await fetchTeamDetails(teamId);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // (unused) helper for future owner checks
  // const isTeamOwner = (team: Team) => {
  //   const member = teamMembers.find(m => m.user_id === currentUserId);
  //   return member?.role === 'owner';
  // };


  if (loading) {
    return (
      <div className="teams-container">
        <main className="teams-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading teams...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="teams-container">
      
      <main className="teams-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>Teams</h1>
            <p className="subtitle">Collaborate with your team members on projects</p>
          </div>
          <div className="header-right">
            <button onClick={() => setShowCreateModal(true)} className="btn-create-team">
              + Create New Team
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No teams yet</h3>
            <p>Create your first team to start collaborating</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-create-empty">
              + Create Team
            </button>
          </div>
        ) : (
          <div className="teams-grid">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onView={handleViewTeam}
                onDelete={(id) => setShowDeleteModal(id)}
                isOwner={team.owner_id === currentUserId}
              />
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <CreateTeamModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTeam}
          />
        )}

        {/* Team Detail Modal */}
        {selectedTeam && (
          <TeamDetailModal
            team={selectedTeam}
            members={teamMembers}
            activities={teamActivities}
            onClose={() => setSelectedTeam(null)}
            onInvite={(email, role) => handleInviteMember(selectedTeam.id, email, role)}
            onRemoveMember={(memberId) => {
              const member = teamMembers.find(m => m.id === memberId);
              if (member && confirm(`Remove ${member.full_name} from this team?`)) {
                handleRemoveMember(selectedTeam.id, memberId, member.full_name);
              }
            }}
            onRoleChange={(memberId, newRole) => {
              const member = teamMembers.find(m => m.id === memberId);
              if (member) {
                handleRoleChange(selectedTeam.id, memberId, newRole, member.full_name);
              }
            }}
            currentUserId={currentUserId}
          />
        )}

        {/* Delete Team Modal */}
        {showDeleteModal && (
          <DeleteTeamModal
            teamName={teams.find(t => t.id === showDeleteModal)?.name || ''}
            onConfirm={() => handleDeleteTeam(showDeleteModal)}
            onClose={() => setShowDeleteModal(null)}
          />
        )}
      </main>

      <style>{`
        .teams-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .teams-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .teams-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .page-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.25rem;
        }
        
        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }
        
        .btn-create-team {
          padding: 0.6rem 1.2rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 30px;
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-create-team:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124,95,230,0.4);
        }
        
        .search-bar {
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.3);
          border-radius: 40px;
          padding: 0.5rem 1rem;
          margin-bottom: 2rem;
        }
        
        .search-icon {
          font-size: 1.2rem;
          margin-right: 0.5rem;
          color: rgba(255,255,255,0.5);
        }
        
        .search-bar input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 0.9rem;
          outline: none;
        }
        
        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        
        .team-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.2s;
        }
        
        .team-card:hover {
          transform: translateY(-3px);
          background: rgba(0,0,0,0.5);
          border-color: rgba(124,95,230,0.3);
        }
        
        .team-card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .team-icon {
          font-size: 2rem;
        }
        
        .team-info {
          flex: 1;
        }
        
        .team-name {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .team-description {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .owner-badge {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.6rem;
        }
        
        .team-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .team-stat {
          flex: 1;
          text-align: center;
        }
        
        .stat-value {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #2fd4ff;
        }
        
        .stat-label {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.5);
        }
        
        .team-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-view-team, .btn-delete-team {
          flex: 1;
          padding: 0.4rem;
          border-radius: 20px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-view-team {
          background: rgba(47,212,255,0.2);
          color: #2fd4ff;
        }
        
        .btn-delete-team {
          background: rgba(252,129,129,0.2);
          color: #fc8181;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          margin-bottom: 0.5rem;
        }
        
        .empty-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1rem;
        }
        
        .btn-create-empty {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 30px;
          color: #0a0d1a;
          cursor: pointer;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content.large {
          max-width: 800px;
        }
        
        .modal-content.small {
          max-width: 400px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.8);
        }
        
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .btn-cancel, .btn-create, .btn-close {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .btn-create {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        
        .warning-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .warning-text {
          color: #fc8181;
          font-size: 0.8rem;
          text-align: center;
        }
        
        .btn-confirm-delete {
          background: #fc8181;
          color: #1a1a2e;
        }
        
        /* Team Detail Modal Styles */
        .team-info-section {
          margin-bottom: 1.5rem;
        }
        
        .team-description-full {
          color: rgba(255,255,255,0.8);
          margin-bottom: 0.5rem;
        }
        
        .team-project {
          margin-bottom: 0.5rem;
        }
        
        .team-project a {
          color: #2fd4ff;
          text-decoration: none;
          margin-left: 0.5rem;
        }
        
        .team-meta {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          display: flex;
          gap: 1rem;
        }
        
        .members-section {
          margin-bottom: 1.5rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .btn-invite {
          padding: 0.3rem 0.8rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 20px;
          color: #9b7ff0;
          cursor: pointer;
          font-size: 0.7rem;
        }
        
        .invite-form {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        
        .invite-form input, .invite-form select {
          flex: 1;
          padding: 0.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .members-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .member-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        .member-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        
        .member-info {
          flex: 1;
        }
        
        .member-name {
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .you-badge {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
          font-size: 0.6rem;
          padding: 0.1rem 0.3rem;
          border-radius: 10px;
          margin-left: 0.3rem;
        }
        
        .member-email {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        
        .member-role select {
          padding: 0.2rem 0.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 15px;
          color: white;
          font-size: 0.7rem;
        }
        
        .role-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 15px;
          font-size: 0.7rem;
        }
        
        .role-owner { background: rgba(124,95,230,0.2); color: #9b7ff0; }
        .role-admin { background: rgba(47,212,255,0.2); color: #2fd4ff; }
        .role-member { background: rgba(72,187,120,0.2); color: #48bb78; }
        .role-viewer { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        
        .remove-member {
          background: rgba(252,129,129,0.2);
          border: none;
          padding: 0.2rem 0.5rem;
          border-radius: 15px;
          color: #fc8181;
          cursor: pointer;
          font-size: 0.65rem;
        }
        
        .activities-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .activity-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .activity-icon {
          font-size: 1rem;
        }
        
        .activity-content {
          flex: 1;
        }
        
        .activity-text {
          font-size: 0.75rem;
        }
        
        .activity-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
        }
        
        .no-activities {
          text-align: center;
          color: rgba(255,255,255,0.5);
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Teams;