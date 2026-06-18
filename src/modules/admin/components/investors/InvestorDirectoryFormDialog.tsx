import { useEffect, useState } from 'react';
import {
  EMPTY_INVESTOR_DIRECTORY_FORM,
  INVESTOR_DIRECTORY_TYPES,
  type AdminInvestorDirectoryFormValues,
  type AdminInvestorDirectoryRow,
} from '../../types/investorsAdmin.types';

export type InvestorDirectoryFormMode = 'create' | 'edit';

interface InvestorDirectoryFormDialogProps {
  open: boolean;
  mode: InvestorDirectoryFormMode;
  investor?: AdminInvestorDirectoryRow | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: AdminInvestorDirectoryFormValues) => Promise<void>;
}

function investorToForm(investor: AdminInvestorDirectoryRow): AdminInvestorDirectoryFormValues {
  return {
    name: investor.name,
    type: investor.type,
    focus_industries: investor.focus_industries.join(', '),
    investment_range_min: investor.investment_range_min,
    investment_range_max: investor.investment_range_max,
    description: investor.description,
    logo_url: investor.logo_url ?? '',
    website: investor.website,
    contact_email: investor.contact_email,
    is_active: investor.is_active,
  };
}

export function InvestorDirectoryFormDialog({
  open,
  mode,
  investor,
  saving,
  onClose,
  onSubmit,
}: InvestorDirectoryFormDialogProps) {
  const [form, setForm] = useState<AdminInvestorDirectoryFormValues>(EMPTY_INVESTOR_DIRECTORY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(investor ? investorToForm(investor) : EMPTY_INVESTOR_DIRECTORY_FORM);
  }, [open, investor]);

  if (!open) return null;

  const title = mode === 'create' ? 'Add investor listing' : 'Edit investor listing';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (form.investment_range_max < form.investment_range_min) {
      setError('Maximum check size must be greater than or equal to minimum.');
      return;
    }
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save investor');
    }
  };

  return (
    <div className="admin-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="investor-form-title">
      <div className="admin-dialog admin-dialog--wide">
        <h3 id="investor-form-title">{title}</h3>
        {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

        <form className="admin-career-form" onSubmit={handleSubmit}>
          <div className="admin-career-form-grid">
            <label className="admin-career-form-span2">
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label>
              Type
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as AdminInvestorDirectoryFormValues['type'] })
                }
              >
                {INVESTOR_DIRECTORY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Active in directory
              <select
                value={form.is_active ? 'yes' : 'no'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'yes' })}
              >
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </select>
            </label>

            <label>
              Min check (USD)
              <input
                type="number"
                min={0}
                value={form.investment_range_min}
                onChange={(e) =>
                  setForm({ ...form, investment_range_min: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Max check (USD)
              <input
                type="number"
                min={0}
                value={form.investment_range_max}
                onChange={(e) =>
                  setForm({ ...form, investment_range_max: Number(e.target.value) })
                }
              />
            </label>

            <label className="admin-career-form-span2">
              Focus industries (comma-separated)
              <input
                type="text"
                value={form.focus_industries}
                onChange={(e) => setForm({ ...form, focus_industries: e.target.value })}
                placeholder="Technology, FinTech, Healthcare"
              />
            </label>

            <label className="admin-career-form-span2">
              Contact email
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </label>

            <label>
              Website
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
              />
            </label>

            <label>
              Logo URL
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://"
              />
            </label>

            <label className="admin-career-form-span2">
              Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </div>

          <div className="admin-dialog-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Add investor' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
