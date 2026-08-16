import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi, rolesApi, type PermissionDefinition, type TripRole } from '../api/services';
import { Button } from '../components/ui/core';
import { FormDialogRoot, FormDialogContent, FormDialogHeader, FormDialogTitle, FormDialogBody, FormDialogFooter, FormDialogClose } from '../components/ui/FormDialog';
import { usePreferences } from '../contexts/PreferencesContext';
import { useState, useEffect } from 'react';
import { translateError } from '../utils/translations';
import { Shield, X, Loader2, Tag, User } from 'lucide-react';

interface Props {
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MemberPermissionsModal({ memberId, open, onOpenChange }: Props) {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const queryClient = useQueryClient();

  const [localOverrides, setLocalOverrides] = useState<Record<string, 'allow' | 'deny'>>({});
  const [localRoleId, setLocalRoleId] = useState<string | null | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showSuccess = (msg: string) => { setMessage(msg); setError(''); };
  const showError = (err: any) => {
    const raw = err?.message || 'Something went wrong';
    setError(translateError(raw, fa));
    setMessage('');
  };

  const { data: memberPermsRes, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions', 'member', memberId],
    queryFn: () => permissionsApi.getMember(memberId),
    enabled: open,
  });

  const { data: registryRes } = useQuery({
    queryKey: ['permissions', 'registry'],
    queryFn: permissionsApi.getRegistry,
    enabled: open,
  });

  const { data: rolesRes } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: ({ grants }: { grants: { permission: string; effect: 'allow' | 'deny' }[] }) =>
      permissionsApi.setMember(memberId, grants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      showSuccess(fa ? 'دسترسی‌ها با موفقیت ذخیره شد.' : 'Permissions saved successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: string | null }) =>
      permissionsApi.assignRole(memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      showSuccess(fa ? 'نقش با موفقیت اختصاص داده شد.' : 'Role assigned successfully.');
    },
    onError: (err: any) => showError(err),
  });

  useEffect(() => {
    if (open) {
      setLocalOverrides({});
      setLocalRoleId(undefined);
      setMessage('');
      setError('');
    }
  }, [open]);

  const registry: PermissionDefinition[] = registryRes?.data?.permissions || [];
  const groups = [...new Set(registry.map(p => p.group))];
  const roles: TripRole[] = rolesRes?.data || [];
  const memberData = memberPermsRes?.data;
  const storedOverrides: Record<string, 'allow' | 'deny'> = {};
  if (memberData?.overrides) {
    for (const o of memberData.overrides) {
      storedOverrides[o.permission] = o.effect as 'allow' | 'deny';
    }
  }
  const currentOverrides = Object.keys(localOverrides).length > 0 ? localOverrides : storedOverrides;
  const currentRoleId = localRoleId !== undefined ? localRoleId : (memberData?.customRoleId || null);

  const toggleOverride = (permission: string, currentEffect?: 'allow' | 'deny') => {
    setLocalOverrides(prev => {
      const next = { ...prev };
      if (!currentEffect) {
        next[permission] = 'allow';
      } else if (currentEffect === 'allow') {
        next[permission] = 'deny';
      } else {
        delete next[permission];
      }
      return next;
    });
  };

  const handleSave = () => {
    const grants = Object.entries(currentOverrides).map(([permission, effect]) => ({ permission, effect }));
    saveMutation.mutate({ grants });
    if (localRoleId !== undefined) {
      assignRoleMutation.mutate({ roleId: currentRoleId || null });
    }
  };

  const hasChanges = Object.keys(localOverrides).length > 0 || localRoleId !== undefined;

  const effectLabel = (effect: 'allow' | 'deny') => effect === 'allow' ? (fa ? 'اجازه' : 'Allow') : (fa ? 'ممنوع' : 'Deny');
  const effectColor = (effect: 'allow' | 'deny') => effect === 'allow' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20';

  return (
    <FormDialogRoot open={open} onOpenChange={onOpenChange}>
      <FormDialogContent className="max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle className="flex items-center gap-2">
            <Shield size={20} />
            {fa ? 'مدیریت دسترسی‌ها' : 'Permissions'}
          </FormDialogTitle>
        </FormDialogHeader>
        <FormDialogBody>
          {loadingPerms ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
          ) : (
            <div className="space-y-5">
              {message && (
                <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                  {error}
                </div>
              )}

              {/* Role Assignment */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-muted-foreground" />
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {fa ? 'نقش' : 'Role'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setLocalRoleId(null)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-start transition ${
                      currentRoleId === null
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700'
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <User size={14} />
                    <span className="truncate">{fa ? 'پیش‌فرض' : 'Default'}</span>
                  </button>
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setLocalRoleId(role.id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-start transition ${
                        currentRoleId === role.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700'
                          : 'hover:bg-accent text-muted-foreground'
                      }`}
                    >
                      <Shield size={14} className="shrink-0" />
                      <span className="truncate">{role.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Overrides */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {fa ? 'تغییرات دسترسی' : 'Permission Overrides'}
                </p>
                <div className="max-h-72 overflow-y-auto space-y-3 rounded-lg border border-border p-3">
                  {groups.map((group) => {
                    const groupPerms = registry.filter(p => p.group === group);
                    return (
                      <div key={group}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {group}
                        </p>
                        <div className="grid gap-1">
                          {groupPerms.map((perm) => {
                            const effect = currentOverrides[perm.key];
                            return (
                              <button
                                key={perm.key}
                                type="button"
                                onClick={() => toggleOverride(perm.key, effect)}
                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition text-start ${
                                  effect
                                    ? effectColor(effect)
                                    : 'text-muted-foreground hover:bg-accent'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{fa ? perm.label.fa : perm.label.en}</p>
                                  <p className="text-xs opacity-70 truncate">{fa ? perm.description.fa : perm.description.en}</p>
                                </div>
                                {effect ? (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-xs">{effectLabel(effect)}</span>
                                    <X size={14} className="opacity-50" />
                                  </div>
                                ) : (
                                  <span className="text-xs opacity-50 shrink-0">{fa ? 'پیش‌فرض' : 'Default'}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </FormDialogBody>
        <FormDialogFooter>
          <FormDialogClose asChild>
            <Button type="button" variant="secondary">{fa ? 'لغو' : 'Cancel'}</Button>
          </FormDialogClose>
          <Button
            loading={saveMutation.isPending || assignRoleMutation.isPending}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            {fa ? 'ذخیره' : 'Save'}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialogRoot>
  );
}
