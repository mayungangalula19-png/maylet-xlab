import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCareerApplication,
  getCareerResumeSignedUrl,
  updateCareerApplicationReview,
  type CareerApplicationRow,
  type CareerApplicationStatus,
} from '../../../../services/careers.service';

const STATUS_OPTIONS: CareerApplicationStatus[] = [
  'pending',
  'reviewing',
  'shortlisted',
  'rejected',
  'accepted',
];

export default function AdminCareerDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<CareerApplicationRow | null>(null);
  const [status, setStatus] = useState<CareerApplicationStatus>('pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data, error: loadError } = await getCareerApplication(id);
      if (loadError) setError(loadError);
      if (data) {
        setApplication(data);
        setStatus(data.status);
        setNotes(data.reviewer_notes ?? '');
        if (data.resume_path) {
          const signed = await getCareerResumeSignedUrl(data.resume_path);
          setResumeUrl(signed.url);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const { data, error: saveError } = await updateCareerApplicationReview(id, {
      status,
      reviewerNotes: notes,
    });

    setSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    if (data) setApplication(data);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#e8e8f0' }}>Loading application…</div>;
  }

  if (!application) {
    return (
      <div style={{ padding: '2rem', color: '#e8e8f0' }}>
        <Link to="/admin/careers" style={{ color: '#9b7ff0' }}>
          ← Back to queue
        </Link>
        <p>Application not found.</p>
      </div>
    );
  }

  const topMatches = application.maya_match_snapshot?.matches?.slice(0, 3) ?? [];

  return (
    <div style={{ padding: '2rem', color: '#e8e8f0', maxWidth: 900 }}>
      <Link to="/admin/careers" style={{ color: '#9b7ff0', fontSize: '0.85rem' }}>
        ← Back to queue
      </Link>

      <h1 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>{application.full_name}</h1>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
        {application.role_interest} · {application.email}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <section style={panelStyle}>
          <h3 style={headingStyle}>Application</h3>
          <p>
            <strong>Skills:</strong> {application.skills}
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Portfolio:</strong>
            <br />
            <span style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.85 }}>
              {application.portfolio}
            </span>
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>
            Submitted {new Date(application.created_at).toLocaleString()}
          </p>
        </section>

        <section style={panelStyle}>
          <h3 style={headingStyle}>MAYA match snapshot</h3>
          {topMatches.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {topMatches.map((m) => (
                <li key={m.role} style={{ marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  {m.role} — <strong>{m.score}%</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>No match data stored.</p>
          )}
        </section>
      </div>

      <section style={{ ...panelStyle, marginBottom: '1.5rem' }}>
        <h3 style={headingStyle}>Resume</h3>
        {application.resume_path ? (
          resumeUrl ? (
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2fd4ff' }}>
              Download {application.resume_file_name ?? 'resume'} (signed link, 2 min)
            </a>
          ) : (
            <p style={{ opacity: 0.7 }}>
              Resume on file ({application.resume_file_name}). Run phase 2 SQL for storage bucket access.
            </p>
          )
        ) : (
          <p style={{ opacity: 0.6 }}>No resume uploaded.</p>
        )}
      </section>

      <section style={panelStyle}>
        <h3 style={headingStyle}>Review</h3>
        {saved && <p style={{ color: '#68d391', marginBottom: '0.75rem' }}>Review saved. Applicant notified.</p>}
        {error && <p style={{ color: '#fc8181', marginBottom: '0.75rem' }}>{error}</p>}

        <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CareerApplicationStatus)}
          style={inputStyle}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label style={{ display: 'block', margin: '1rem 0 0.35rem', fontSize: '0.85rem' }}>
          Reviewer notes (internal)
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Interview notes, strengths, concerns…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: '1rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #7c5fe6, #2fd4ff)',
            color: '#0a0d1a',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save review'}
        </button>
      </section>
    </div>
  );
}

const panelStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: '1.25rem',
};

const headingStyle: CSSProperties = {
  margin: '0 0 0.75rem',
  fontSize: '1rem',
  color: '#9b7ff0',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  fontFamily: 'inherit',
};
