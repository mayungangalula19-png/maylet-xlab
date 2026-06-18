import type { AdminUserFormValues, AdminUserProfile, AdminUserUpdateValues } from '../types/userAdmin.types';

export function validateAdminUserCreate(values: AdminUserFormValues): string | null {
  if (!values.email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Enter a valid email';
  if (!values.password || values.password.length < 6) return 'Password must be at least 6 characters';
  if (!values.full_name.trim()) return 'Full name is required';
  if (!values.role) return 'Role is required';
  return null;
}

export function validateAdminUserUpdate(values: AdminUserUpdateValues): string | null {
  if (!values.full_name.trim()) return 'Full name is required';
  if (!values.role) return 'Role is required';
  return null;
}

export function profileToFormValues(profile: AdminUserProfile): AdminUserUpdateValues {
  return {
    full_name: profile.full_name ?? '',
    role: (profile.role as AdminUserUpdateValues['role']) ?? 'innovator',
    plan: (profile.plan as AdminUserUpdateValues['plan']) ?? 'free',
    user_type: profile.user_type ?? '',
    organization_name: profile.organization_name ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    github_handle: profile.github_handle ?? '',
    twitter_handle: profile.twitter_handle ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    phone: profile.phone ?? '',
  };
}
