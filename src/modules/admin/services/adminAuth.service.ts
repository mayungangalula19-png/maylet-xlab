import { supabase } from '../../../lib/supabase/client';
import { hasAdminPermission, type AdminPermission } from '../config/adminRbac.config';
import type { AdminRole, AdminSession } from '../types/admin.types';

const ADMIN_ROLES: AdminRole[] = ['admin', 'super_admin'];
const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'admintest@gmail.com',
  'mayungangalula19@gmail.com',
]);

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
  if (!session?.user?.email) return null;

  // Bypass broken DB enum: verify admin via email
  const isEmailAdmin = ADMIN_EMAILS.has(session.user.email.toLowerCase());
  
  if (!isEmailAdmin) {
     return null;
  }

  // Attempt to fetch profile for full name, but ignore role/errors
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    email: session.user.email,
    fullName: profile?.full_name || session.user.email.split('@')[0],
    role: 'admin',
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
