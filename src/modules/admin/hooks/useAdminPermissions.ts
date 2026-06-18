import { useCallback, useMemo } from 'react';
import { useAuthContext } from '../../../contexts/AuthContext';
import {
  adminRoleLabel,
  hasAdminPermission,
  isSuperAdminRole,
  type AdminPermission,
} from '../config/adminRbac.config';
import type { AdminPageAction } from '../types/admin.types';

export function useAdminPermissions() {
  const { role, roleLoading } = useAuthContext();

  const can = useCallback(
    (permission: AdminPermission) => hasAdminPermission(role, permission),
    [role]
  );

  const filterActions = useCallback(
    (actions: AdminPageAction[] | undefined) => {
      if (!actions) return undefined;
      return actions.filter((action) => !action.permission || can(action.permission));
    },
    [can]
  );

  return useMemo(
    () => ({
      role,
      roleLoading,
      can,
      filterActions,
      isSuperAdmin: isSuperAdminRole(role),
      roleLabel: adminRoleLabel(role),
    }),
    [role, roleLoading, can, filterActions]
  );
}
