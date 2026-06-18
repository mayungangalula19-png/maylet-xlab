import type { ReactNode } from 'react';
import { AdminButton } from '../ui/AdminButton';
import {
  ADMIN_USER_PLANS,
  ADMIN_USER_ROLES,
  type AdminUserFormValues,
  type AdminUserUpdateValues,
} from '../../types/userAdmin.types';

interface AdminUserFormProps {
  mode: 'create' | 'edit';
  values: AdminUserFormValues | AdminUserUpdateValues;
  onChange: (patch: Partial<AdminUserFormValues & AdminUserUpdateValues>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
  error?: string | null;
}

export function AdminUserForm({
  mode,
  values,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  error,
}: AdminUserFormProps) {
  const isCreate = mode === 'create';
  const createValues = values as AdminUserFormValues;

  return (
    <form
      className="admin-user-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}

      <div className="admin-form-grid">
        {isCreate ? (
          <>
            <FormField label="Email" required>
              <input
                type="email"
                className="admin-form-input"
                value={createValues.email}
                onChange={(e) => onChange({ email: e.target.value })}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Temporary password" required hint="Min 6 characters — user can reset later">
              <input
                type="password"
                className="admin-form-input"
                value={createValues.password}
                onChange={(e) => onChange({ password: e.target.value })}
                autoComplete="new-password"
              />
            </FormField>
          </>
        ) : null}

        <FormField label="Full name" required>
          <input
            type="text"
            className="admin-form-input"
            value={values.full_name}
            onChange={(e) => onChange({ full_name: e.target.value })}
          />
        </FormField>

        <FormField label="Role" required>
          <select
            className="admin-form-input"
            value={values.role}
            onChange={(e) => onChange({ role: e.target.value as AdminUserFormValues['role'] })}
          >
            {ADMIN_USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Plan">
          <select
            className="admin-form-input"
            value={values.plan}
            onChange={(e) => onChange({ plan: e.target.value as AdminUserFormValues['plan'] })}
          >
            {ADMIN_USER_PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="User type">
          <input
            type="text"
            className="admin-form-input"
            value={values.user_type}
            onChange={(e) => onChange({ user_type: e.target.value })}
            placeholder="student, researcher, founder…"
          />
        </FormField>

        <FormField label="Organization">
          <input
            type="text"
            className="admin-form-input"
            value={values.organization_name}
            onChange={(e) => onChange({ organization_name: e.target.value })}
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="tel"
            className="admin-form-input"
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </FormField>

        <FormField label="Location">
          <input
            type="text"
            className="admin-form-input"
            value={values.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </FormField>

        <FormField label="Website" className="admin-form-span-2">
          <input
            type="url"
            className="admin-form-input"
            value={values.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://"
          />
        </FormField>

        <FormField label="Bio" className="admin-form-span-2">
          <textarea
            className="admin-form-textarea"
            rows={4}
            value={values.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
          />
        </FormField>

        <FormField label="GitHub">
          <input
            type="text"
            className="admin-form-input"
            value={values.github_handle}
            onChange={(e) => onChange({ github_handle: e.target.value })}
          />
        </FormField>

        <FormField label="Twitter / X">
          <input
            type="text"
            className="admin-form-input"
            value={values.twitter_handle}
            onChange={(e) => onChange({ twitter_handle: e.target.value })}
          />
        </FormField>

        <FormField label="LinkedIn" className="admin-form-span-2">
          <input
            type="url"
            className="admin-form-input"
            value={values.linkedin_url}
            onChange={(e) => onChange({ linkedin_url: e.target.value })}
          />
        </FormField>
      </div>

      <div className="admin-form-actions">
        <AdminButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </AdminButton>
        <AdminButton type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving…' : isCreate ? 'Create user' : 'Save changes'}
        </AdminButton>
      </div>
    </form>
  );
}

function FormField({
  label,
  children,
  required,
  hint,
  className = '',
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`admin-form-field ${className}`.trim()}>
      <span className="admin-form-label">
        {label}
        {required ? ' *' : ''}
      </span>
      {hint ? <span className="admin-form-hint">{hint}</span> : null}
      {children}
    </label>
  );
}
