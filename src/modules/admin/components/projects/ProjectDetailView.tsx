import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectLifecyclePanel } from './ProjectLifecyclePanel';
import { AdminTabs } from '../ui/AdminTabs';
import { timeAgo } from '../../hooks/useAdminDashboard';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';
import {
  formatFileSize,
  projectProgressColor,
  projectSectorIcon,
  projectStatusColor,
  teamRoleIcon,
} from '../../utils/projectAdmin.utils';
import {
  PROJECT_DETAIL_TABS,
  type AdminProjectDetailBundle,
  type AdminProjectDetailTab,
} from '../../types/projectAdmin.types';

interface ProjectDetailViewProps {
  bundle: AdminProjectDetailBundle;
}

export function ProjectDetailView({ bundle }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<AdminProjectDetailTab>('overview');
  const { project, tasks, teamMembers, documents, activities } = bundle;

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const budgetPercentage =
    project.budget_total > 0
      ? Math.round((project.budget_used / project.budget_total) * 100)
      : 0;
  const statusColor = projectStatusColor(project.status);

  return (
    <>
      <div className="admin-project-detail-meta">
        <span className="admin-badge admin-badge--purple">
          {projectSectorIcon(project.sector)} {project.sector || 'General'}
        </span>
        <span className="admin-badge" style={{ background: `${statusColor}33`, color: statusColor }}>
          {project.status}
        </span>
        <span className="admin-detail-mono">ID: {project.id.slice(0, 8)}…</span>
      </div>

      <AdminTabs tabs={PROJECT_DETAIL_TABS} active={activeTab} onChange={setActiveTab} />

      <div className="admin-tab-panel">
        {activeTab === 'overview' && (
          <div className="admin-two-columns">
            <div className="admin-project-detail-col">
              <ProjectLifecyclePanel projectId={project.id} projectName={project.name} />

              <section className="admin-section-card">
                <h3>Description</h3>
                <p className="admin-project-description">
                  {project.description || 'No description provided.'}
                </p>
              </section>

              <section className="admin-section-card">
                <h3>Progress</h3>
                <div className="admin-status-label">
                  <span>Completion</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="admin-progress-bar">
                  <div
                    className="admin-progress active"
                    style={{
                      width: `${project.progress}%`,
                      background: projectProgressColor(project.progress),
                    }}
                  />
                </div>
              </section>

              {project.budget_total > 0 ? (
                <section className="admin-section-card">
                  <h3>Budget</h3>
                  <div className="admin-project-budget-grid">
                    <div>
                      <div className="admin-quick-stat-label">Used</div>
                      <div className="admin-quick-stat-value">${project.budget_used.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="admin-quick-stat-label">Total</div>
                      <div className="admin-quick-stat-value">${project.budget_total.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="admin-quick-stat-label">Remaining</div>
                      <div className="admin-quick-stat-value">
                        ${(project.budget_total - project.budget_used).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="admin-progress-bar">
                    <div className="admin-progress active" style={{ width: `${budgetPercentage}%` }} />
                  </div>
                  <p className="admin-form-hint">{budgetPercentage}% of budget used</p>
                </section>
              ) : null}

              {project.tech_stack.length > 0 ? (
                <section className="admin-section-card">
                  <h3>Tech stack</h3>
                  <div className="admin-project-tags">
                    {project.tech_stack.map((tech) => (
                      <span key={tech} className="admin-badge admin-badge--default">
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="admin-project-detail-col">
              <div className="admin-project-mini-stats">
                <MiniStat icon="👥" value={String(teamMembers.length)} label="Team members" />
                <MiniStat icon="✅" value={`${completedTasks}/${tasks.length}`} label="Tasks done" />
                <MiniStat icon="📄" value={String(documents.length)} label="Documents" />
                <MiniStat icon="👤" value={project.user_name} label="Owner" />
              </div>

              <section className="admin-section-card">
                <h3>Owner</h3>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{project.user_name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div>{project.user_name}</div>
                    <div className="admin-project-meta">{project.user_email}</div>
                    <Link to={`/admin/users/${project.user_id}`} className="admin-card-link">
                      View profile →
                    </Link>
                  </div>
                </div>
              </section>

              <section className="admin-section-card">
                <h3>Timeline</h3>
                <div className="admin-project-timeline">
                  <TimelineItem title="Project created" date={formatAdminDateTime(project.created_at)} />
                  <TimelineItem title="Last updated" date={formatAdminDateTime(project.updated_at)} />
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <section className="admin-section-card">
            <h3>Tasks ({tasks.length})</h3>
            <div className="admin-project-summary-row">
              <span className="admin-badge admin-badge--default">To do: {todoTasks}</span>
              <span className="admin-badge admin-badge--warning">In progress: {inProgressTasks}</span>
              <span className="admin-badge admin-badge--success">Done: {completedTasks}</span>
            </div>
            <div className="admin-project-list">
              {tasks.length === 0 ? (
                <p className="admin-empty-state">No tasks created yet.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="admin-project-list-item">
                    <div className="admin-project-list-icon">{taskStatusIcon(task.status)}</div>
                    <div>
                      <div className="admin-project-title">{task.title}</div>
                      {task.description ? (
                        <div className="admin-project-meta">{task.description}</div>
                      ) : null}
                      <div className="admin-project-meta">
                        Assigned: {task.assigned_to_name}
                        {task.due_date ? ` · Due ${formatAdminDate(task.due_date)}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'team' && (
          <section className="admin-section-card">
            <h3>Team ({teamMembers.length})</h3>
            <div className="admin-project-list">
              {teamMembers.length === 0 ? (
                <p className="admin-empty-state">No team members yet.</p>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="admin-project-list-item">
                    <div className="admin-user-avatar">{member.full_name.charAt(0).toUpperCase()}</div>
                    <div className="admin-project-list-grow">
                      <div className="admin-project-title">{member.full_name}</div>
                      <div className="admin-project-meta">{member.email}</div>
                      <div className="admin-project-meta">
                        {teamRoleIcon(member.role)} {member.role}
                        {member.joined_at ? ` · Joined ${formatAdminDate(member.joined_at)}` : ''}
                      </div>
                    </div>
                    <Link to={`/admin/users/${member.user_id}`} className="admin-action-link">
                      Profile
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'documents' && (
          <section className="admin-section-card">
            <h3>Documents ({documents.length})</h3>
            <div className="admin-project-list">
              {documents.length === 0 ? (
                <p className="admin-empty-state">No documents uploaded yet.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="admin-project-list-item">
                    <div className="admin-project-list-icon">📄</div>
                    <div className="admin-project-list-grow">
                      <div className="admin-project-title">{doc.name}</div>
                      <div className="admin-project-meta">
                        {formatFileSize(doc.size)} · {doc.uploaded_by_name} ·{' '}
                        {formatAdminDate(doc.created_at)}
                      </div>
                    </div>
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-action-link"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'activities' && (
          <section className="admin-section-card">
            <h3>Activity ({activities.length})</h3>
            <div className="admin-activity-list">
              {activities.length === 0 ? (
                <p className="admin-empty-state">No recent activity.</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="admin-activity-item">
                    <div className={`admin-activity-icon ${activity.target_type}`}>
                      {activityIcon(activity.target_type)}
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">
                        <strong>{activity.user_name}</strong> {activity.action}
                      </div>
                      <div className="admin-activity-time">{timeAgo(activity.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function MiniStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="admin-project-mini-stat">
      <span className="admin-project-mini-stat-icon">{icon}</span>
      <div>
        <div className="admin-project-mini-stat-value">{value}</div>
        <div className="admin-quick-stat-label">{label}</div>
      </div>
    </div>
  );
}

function TimelineItem({ title, date }: { title: string; date: string }) {
  return (
    <div className="admin-project-timeline-item">
      <div className="admin-project-timeline-dot" />
      <div>
        <div className="admin-project-title">{title}</div>
        <div className="admin-project-meta">{date}</div>
      </div>
    </div>
  );
}

function taskStatusIcon(status: string) {
  if (status === 'done') return '✅';
  if (status === 'in_progress') return '🟡';
  return '⭕';
}

function activityIcon(type: string) {
  if (type === 'task') return '✅';
  if (type === 'document') return '📄';
  if (type === 'team') return '👥';
  if (type === 'payment' || type === 'funding') return '💰';
  return '📁';
}
