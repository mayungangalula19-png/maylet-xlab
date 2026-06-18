import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminListPage } from '../../components/layout/AdminListPage';
import { AdminDataTable } from '../../components/tables/AdminDataTable';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import {
  listCareerApplications,
  type CareerApplicationRow,
  type CareerApplicationStatus,
} from '../../../careers/services/careers.service';

const PAGE_SIZE = 25;

const STATUS_OPTIONS: { value: CareerApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
];

export default function AdminCareerApplications() {
  const { can, roleLoading } = useAdminPermissions();
  const [applications, setApplications] = useState<CareerApplicationRow[]>([]);
  const [status, setStatus] = useState<CareerApplicationStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await listCareerApplications({ status, page, pageSize: PAGE_SIZE });
      if (cancelled) return;
      if (result.error) setError(result.error);
      setApplications(result.data);
      setTotal(result.total);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  if (roleLoading) return null;
  if (!can('manage_users')) {
    return (
      <AdminListPage title="Applications" breadcrumbs={adminBreadcrumbsFor('/admin/careers')}>
        <AdminPermissionDenied permission="manage_users" />
      </AdminListPage>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const crumbs = [
    ...adminBreadcrumbsFor('/admin/careers'),
    { label: 'Applications' },
  ];

  return (
    <AdminListPage
      title="Career Applications"
      subtitle="Review ecosystem talent applications from /careers"
      breadcrumbs={crumbs}
      loading={loading}
      error={
        error?.includes('career_applications')
          ? 'Run scripts/create-career-applications-table.sql in Supabase SQL Editor.'
          : error
      }
      total={total}
      range={{
        showingFrom: total === 0 ? 0 : page * PAGE_SIZE + 1,
        showingTo: Math.min((page + 1) * PAGE_SIZE, total),
      }}
      page={page}
      totalPages={totalPages}
      canPrev={page > 0}
      canNext={page + 1 < totalPages}
      onPrev={() => setPage((p) => Math.max(0, p - 1))}
      onNext={() => setPage((p) => p + 1)}
      toolbarExtra={
        <div className="admin-careers-app-filters">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`admin-filter-pill ${status === opt.value ? 'active' : ''}`}
              onClick={() => {
                setPage(0);
                setStatus(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
          <Link to="/admin/careers" className="admin-action-link">
            ← Back to careers
          </Link>
        </div>
      }
    >
      <AdminDataTable
        empty={!loading && applications.length === 0}
        emptyTitle="No applications found"
        emptyMessage="Applications from /careers will appear here."
      >
        <thead>
          <tr>
            <th scope="col">Applicant</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Resume</th>
            <th scope="col">Submitted</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>
                <strong>{app.full_name}</strong>
                <div className="admin-project-meta">{app.email}</div>
              </td>
              <td>{app.role_interest}</td>
              <td>
                <span className={`admin-status-badge ${app.status}`}>{app.status}</span>
              </td>
              <td>{app.resume_path ? 'Yes' : '—'}</td>
              <td>{new Date(app.created_at).toLocaleDateString()}</td>
              <td>
                <Link to={`/admin/careers/applications/${app.id}`} className="admin-action-link">
                  Review →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminDataTable>
    </AdminListPage>
  );
}
