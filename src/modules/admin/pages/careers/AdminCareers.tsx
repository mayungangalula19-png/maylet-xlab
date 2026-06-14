import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listCareerApplications,
  type CareerApplicationRow,
  type CareerApplicationStatus,
} from '../../../../services/careers.service';

const PAGE_SIZE = 25;

const STATUS_OPTIONS: { value: CareerApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
];

const statusColor: Record<string, string> = {
  pending: '#f6c90e',
  reviewing: '#2fd4ff',
  shortlisted: '#9b7ff0',
  rejected: '#fc8181',
  accepted: '#68d391',
};

export default function AdminCareers() {
  const [applications, setApplications] = useState<CareerApplicationRow[]>([]);
  const [status, setStatus] = useState<CareerApplicationStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await listCareerApplications({ status, page, pageSize: PAGE_SIZE });
      if (result.error) setError(result.error);
      setApplications(result.data);
      setTotal(result.total);
      setLoading(false);
    };
    load();
  }, [status, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ padding: '2rem', color: '#e8e8f0' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Career Applications</h1>
      <p style={{ opacity: 0.65, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Review ecosystem talent applications from /careers
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setPage(0);
              setStatus(opt.value);
            }}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 20,
              border: status === opt.value ? '1px solid #7c5fe6' : '1px solid rgba(255,255,255,0.15)',
              background: status === opt.value ? 'rgba(124,95,230,0.2)' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ color: '#fc8181', marginBottom: '1rem' }}>
          {error.includes('career_applications')
            ? 'Run scripts/create-career-applications-table.sql in Supabase SQL Editor.'
            : error}
        </p>
      )}

      <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>
        {total} applications · page {page + 1} of {totalPages}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '0.5rem' }}>Applicant</th>
            <th>Role</th>
            <th>Status</th>
            <th>Resume</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '0.65rem 0.5rem' }}>
                <strong>{app.full_name}</strong>
                <div style={{ fontSize: '0.75rem', opacity: 0.65 }}>{app.email}</div>
              </td>
              <td style={{ fontSize: '0.85rem' }}>{app.role_interest}</td>
              <td>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: statusColor[app.status] ?? '#fff',
                    textTransform: 'capitalize',
                  }}
                >
                  {app.status}
                </span>
              </td>
              <td style={{ fontSize: '0.8rem', opacity: 0.8 }}>{app.resume_path ? 'Yes' : '—'}</td>
              <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                {new Date(app.created_at).toLocaleDateString()}
              </td>
              <td>
                <Link to={`/admin/careers/${app.id}`} style={{ color: '#9b7ff0' }}>
                  Review →
                </Link>
              </td>
            </tr>
          ))}
          {!loading && applications.length === 0 && (
            <tr>
              <td colSpan={6} style={{ opacity: 0.6, padding: '1rem' }}>
                No applications found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
        <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={page + 1 >= totalPages || loading}
        >
          Next →
        </button>
        {loading && <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>Loading…</span>}
      </div>
    </div>
  );
}
