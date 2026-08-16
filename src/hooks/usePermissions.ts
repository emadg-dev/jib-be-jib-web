import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';

export function usePermissions() {
  const { user, selectedTrip, permissions } = useAuth();

  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (selectedTrip?.role === 'owner') return true;
      return permissions.includes(permission);
    };
  }, [user, selectedTrip, permissions]);

  const canManagePermissions = useMemo(() => {
    return hasPermission('permissions.manage');
  }, [hasPermission]);

  return { hasPermission, canManagePermissions, permissions };
}
