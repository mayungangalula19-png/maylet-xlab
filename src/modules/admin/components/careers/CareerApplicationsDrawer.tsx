import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminCareerApplications } from '../../services/adminCareers.service';
import type { AdminCareerApplicationSummary, AdminCareerRow } from '../../types/careersAdmin.types';
import { formatAdminDate } from '../../utils/adminPage.utils';
import { AdminLoadingState } from '../layout/AdminLoadingState';

interface CareerApplicationsDrawerProps {
  open: boolean;
  career: AdminCareerRow | null;
  onClose: () => void;
}

export function CareerApplicationsDrawer({ open, career, onClose }: CareerApplicationsDrawerProps) {
  const [applications, setApplications] = useState<AdminCareerApplicationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !career) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await fetchAdminCareerApplications(career.id, career.title);
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        setApplications([]);
      } else {
        setApplications(result.data ?? []);
      }
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, career]);

  if (!open || !career) return null;

  return (
    <div className="admin-drawer-overlay" role="dialog" aria-modal="true" aria-labelledby="career-apps-title">
      <div className="admin-drawer">
        <div className="admin-drawer-header">
          <div>
            <h3 id="career-apps-title">Applications — {career.title}</h3>
            <p className="admin-form-hint">{applications.length} applicant(s) linked to this opportunity</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

        {loading ? (
          <AdminLoadingState label="Loading applications…" />
        ) : applications.length === 0 ? (
          <div className="admin-detail-placeholder">
            <p>No applications yet for this career.</p>
            <Link to="/admin/careers/applications" className="admin-action-link">
              View all applications →
            </Link>
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th scope="col">Applicant</th>
                  <th scope="col">Role interest</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Action</th>
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
                    <td>{app.status}</td>
                    <td>{formatAdminDate(app.created_at)}</td>
                    <td>
                      <Link to={`/admin/careers/applications/${app.id}`} className="admin-action-link">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
