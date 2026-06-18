import { supabase } from '../../../lib/supabase/client';
import { hasAdminPermission, type AdminPermission } from '../config/adminRbac.config';
import type { AdminRole, AdminSession } from '../types/admin.types';

const ADMIN_ROLES: AdminRole[] = ['admin', 'super_admin'];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && ADMIN_ROLES.includes(role as AdminRole);
}

export function canAdmin(role: string | null | undefined, permission: AdminPermission) {
  return hasAdminPermission(role, permission);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', session.user.id)
    .single();

  if (error || !profile || !isAdminRole(profile.role)) return null;

  return {
    userId: session.user.id,
    email: profile.email || session.user.email || '',
    fullName: profile.full_name || session.user.email?.split('@')[0] || 'Admin',
    role: profile.role,
  };
}

/** Server-side guard for admin mutations — throws if permission is missing. */
export async function assertAdminPermission(permission: AdminPermission): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Admin session required');
  }
  if (!hasAdminPermission(session.role, permission)) {
    throw new Error('You do not have permission to perform this action');
  }
  return session;
}
