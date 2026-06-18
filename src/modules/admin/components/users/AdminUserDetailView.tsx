import { Link } from 'react-router-dom';
import { AdminPlanBadge, AdminRoleBadge, AdminStatusBadge } from '../ui/AdminBadge';
import { formatAdminDate, formatAdminDateTime, displayName } from '../../utils/adminPage.utils';
import { timeAgo } from '../../hooks/useAdminDashboard';
import type { AdminUserDetailBundle } from '../../types/userAdmin.types';

interface AdminUserDetailViewProps {
  bundle: AdminUserDetailBundle;
}

export function AdminUserDetailView({ bundle }: AdminUserDetailViewProps) {
  const { profile, projects, activities } = bundle;
  const name = displayName(profile.full_name, profile.email);

  return (
    <div className="admin-user-detail">
      <section className="admin-section-card admin-user-profile-card">
        <div className="admin-user-profile-header">
          <div className="admin-user-avatar admin-user-avatar--lg">{name.charAt(0).toUpperCase()}</div>
          <div>
            <h2 className="admin-user-profile-name">{name}</h2>
            <p className="admin-user-profile-email">{profile.email || '—'}</p>
            <div className="admin-user-profile-badges">
              <AdminRoleBadge role={profile.role} />
              <AdminPlanBadge plan={profile.plan} />
              {profile.status ? <AdminStatusBadge status={profile.status} /> : null}
            </div>
          </div>
        </div>

        <dl className="admin-detail-grid">
          <DetailItem label="User ID" value={profile.id} mono />
          <DetailItem label="User type" value={profile.user_type} />
          <DetailItem label="Organization" value={profile.organization_name} />
          <DetailItem label="Phone" value={profile.phone} />
          <DetailItem label="Location" value={profile.location} />
          <DetailItem label="Joined" value={formatAdminDate(profile.created_at)} />
          <DetailItem label="Last updated" value={formatAdminDateTime(profile.updated_at)} />
          <DetailItem label="2FA" value={profile.two_factor_enabled ? 'Enabled' : 'Disabled'} />
          <DetailItem label="Website" value={profile.website} link />
          <DetailItem label="GitHub" value={profile.github_handle} />
          <DetailItem label="Twitter" value={profile.twitter_handle} />
          <DetailItem label="LinkedIn" value={profile.linkedin_url} link />
        </dl>

        {profile.bio ? (
          <div className="admin-user-bio">
            <h3>Bio</h3>
            <p>{profile.bio}</p>
          </div>
        ) : null}
      </section>

      <section className="admin-section-card">
        <div className="admin-card-header">
          <h3>📁 Projects ({bundle.projectCount})</h3>
          <Link to="/admin/projects" className="admin-card-link">
            All projects →
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="admin-empty-state">No projects yet.</p>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Sector</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td>{project.sector || '—'}</td>
                    <td>{project.status || '—'}</td>
                    <td>{project.progress}%</td>
                    <td>
                      <Link to={`/admin/projects/${project.id}`} className="admin-action-link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section-card">
        <div className="admin-card-header">
          <h3>📝 Recent activity</h3>
        </div>
        <div className="admin-activity-list">
          {activities.length === 0 ? (
            <p className="admin-empty-state">No activity recorded.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="admin-activity-item">
                <div className={`admin-activity-icon ${activity.target_type}`}>•</div>
                <div className="admin-activity-content">
                  <div className="admin-activity-text">
                    {activity.action}
                    {activity.target_name ? (
                      <span className="admin-activity-target"> — {activity.target_name}</span>
                    ) : null}
                  </div>
                  <div className="admin-activity-time">{timeAgo(activity.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
  link,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  link?: boolean;
  mono?: boolean;
}) {
  const display = value?.trim() || '—';
  return (
    <div className="admin-detail-item">
      <dt>{label}</dt>
      <dd className={mono ? 'admin-detail-mono' : undefined}>
        {link && value ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer">
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}
