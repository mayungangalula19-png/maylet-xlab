import { useEffect, useState } from 'react';
import {
  CAREER_DEPARTMENTS,
  CAREER_STATUS_OPTIONS,
  CAREER_TYPE_OPTIONS,
  type AdminCareerFormValues,
  type AdminCareerRow,
  type CareerOpportunityStatus,
  type CareerOpportunityType,
} from '../../types/careersAdmin.types';

export type CareerFormMode = 'create' | 'edit' | 'view';

interface CareerFormDialogProps {
  open: boolean;
  mode: CareerFormMode;
  career?: AdminCareerRow | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: AdminCareerFormValues) => Promise<void>;
}

const EMPTY_FORM: AdminCareerFormValues = {
  title: '',
  type: 'job',
  department: 'Engineering',
  location: 'Remote',
  is_remote: true,
  description: '',
  requirements: '',
  benefits: '',
  application_deadline: '',
  status: 'draft',
};

function careerToForm(career: AdminCareerRow): AdminCareerFormValues {
  return {
    title: career.title,
    type: career.type,
    department: career.department,
    location: career.location,
    is_remote: career.is_remote,
    description: career.description,
    requirements: career.requirements,
    benefits: career.benefits,
    application_deadline: career.application_deadline?.slice(0, 10) ?? '',
    status: career.status,
  };
}

export function CareerFormDialog({
  open,
  mode,
  career,
  saving,
  onClose,
  onSubmit,
}: CareerFormDialogProps) {
  const [form, setForm] = useState<AdminCareerFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(career ? careerToForm(career) : EMPTY_FORM);
  }, [open, career]);

  if (!open) return null;

  const title =
    mode === 'create' ? 'Create Career' : mode === 'edit' ? 'Edit Career' : 'Career Details';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (form.title.trim().length < 2) {
      setError('Title must be at least 2 characters.');
      return;
    }
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save career');
    }
  };

  const departments = CAREER_DEPARTMENTS.filter((d) => d !== 'All');
  const statusOptions = CAREER_STATUS_OPTIONS.filter((s) => s.value !== 'all');

  return (
    <div className="admin-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="career-form-title">
      <div className="admin-dialog admin-dialog--wide">
        <h3 id="career-form-title">{title}</h3>
        {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

        <form className="admin-career-form" onSubmit={handleSubmit}>
          <div className="admin-career-form-grid">
            <label className="admin-form-field admin-career-form-span2">
              <span>Title *</span>
              <input
                type="text"
                value={form.title}
                readOnly={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Type</span>
              <select
                value={form.type}
                disabled={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CareerOpportunityType }))}
              >
                {CAREER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field">
              <span>Status</span>
              <select
                value={form.status}
                disabled={readOnly}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as CareerOpportunityStatus }))
                }
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field">
              <span>Department</span>
              <select
                value={form.department}
                disabled={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field">
              <span>Location</span>
              <input
                type="text"
                value={form.location}
                readOnly={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </label>

            <label className="admin-form-field admin-career-checkbox">
              <input
                type="checkbox"
                checked={form.is_remote}
                disabled={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, is_remote: e.target.checked }))}
              />
              <span>Remote eligible</span>
            </label>

            <label className="admin-form-field">
              <span>Application deadline</span>
              <input
                type="date"
                value={form.application_deadline}
                readOnly={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, application_deadline: e.target.value }))}
              />
            </label>

            <label className="admin-form-field admin-career-form-span2">
              <span>Description</span>
              <textarea
                rows={4}
                value={form.description}
                readOnly={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>

            <label className="admin-form-field admin-career-form-span2">
              <span>Requirements</span>
              <textarea
                rows={3}
                value={form.requirements}
                readOnly={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </label>

            <label className="admin-form-field admin-career-form-span2">
              <span>Benefits</span>
              <textarea
                rows={3}
                value={form.benefits}
                readOnly={readOnly}
                onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
              />
            </label>
          </div>

          <div className="admin-dialog-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={saving}>
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly ? (
              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? 'Saving…' : mode === 'create' ? 'Create career' : 'Save changes'}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
