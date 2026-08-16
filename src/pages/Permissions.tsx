import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi, rolesApi, membersApi, type Member, type PermissionDefinition, type TripRole } from '../api/services';
import { Card, CardContent, Button } from '../components/ui/core';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { translateError } from '../utils/translations';
import { Shield, X, ChevronDown, ChevronUp, Save, Loader2, Tag, User } from 'lucide-react';
import Avatar from '../components/Avatar';
import { PageSkeleton } from '../components/Skeleton';

export default function PermissionsPage() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showSuccess = (msg: string) => { setMessage(msg); setError(''); };
  const showError = (err: any) => {
    const raw = err?.message || 'Something went wrong';
    setError(translateError(raw, fa));
    setMessage('');
  };

  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<string, 'allow' | 'deny'>>>({});
  const [localRole, setLocalRole] = useState<Record<string, string | null>>({});

  const { data: membersRes, isLoading: loadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
  });

  const { data: registryRes } = useQuery({
    queryKey: ['permissions', 'registry'],
    queryFn: permissionsApi.getRegistry,
  });

  const { data: allPermsRes, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: permissionsApi.getAll,
  });

  const { data: memberPermsRes } = useQuery({
    queryKey: ['permissions', 'member', expandedMember],
    queryFn: () => permissionsApi.getMember(expandedMember!),
    enabled: !!expandedMember,
  });

  const { data: rolesRes } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: ({ memberId, grants }: { memberId: string; grants: { permission: string; effect: 'allow' | 'deny' }[] }) =>
      permissionsApi.setMember(memberId, grants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setExpandedMember(null);
      setLocalOverrides({});
      showSuccess(fa ? 'دسترسی‌ها با موفقیت ذخیره شد.' : 'Permissions saved successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string | null }) =>
      permissionsApi.assignRole(memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setLocalRole({});
      showSuccess(fa ? 'نقش با موفقیت اختصاص داده شد.' : 'Role assigned successfully.');
    },
    onError: (err: any) => showError(err),
  });

  if (loadingMembers || loadingPerms) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

  const members: Member[] = membersRes?.data || [];
  const registry: PermissionDefinition[] = registryRes?.data?.permissions || [];
  const groups = [...new Set(registry.map(p => p.group))];
  const allPerms = allPermsRes?.data || {};
  const roles: TripRole[] = rolesRes?.data || [];

  const nonAdminMembers = members.filter(m => m.role !== 'admin' && m.id !== user?.id);

  const getMemberOverrides = (memberId: string) => {
    if (localOverrides[memberId]) return localOverrides[memberId];
    const stored = allPerms[memberId] || {};
    const overrides: Record<string, 'allow' | 'deny'> = {};
    for (const [perm, entries] of Object.entries(stored)) {
      const entry = (entries as any[])[0];
      if (entry) overrides[perm] = entry.effect;
    }
    return overrides;
  };

  const getMemberRoleId = (memberId: string): string | null | undefined => {
    if (memberId in localRole) return localRole[memberId];
    return undefined;
  };

  const toggleOverride = (memberId: string, permission: string, currentEffect?: 'allow' | 'deny') => {
    setLocalOverrides(prev => {
      const memberPerms = { ...(prev[memberId] || getMemberOverrides(memberId)) };
      if (!currentEffect) {
        memberPerms[permission] = 'allow';
      } else if (currentEffect === 'allow') {
        memberPerms[permission] = 'deny';
      } else {
        delete memberPerms[permission];
      }
      return { ...prev, [memberId]: memberPerms };
    });
  };

  const handleSave = (memberId: string) => {
    const overrides = localOverrides[memberId] || getMemberOverrides(memberId);
    const grants = Object.entries(overrides).map(([permission, effect]) => ({ permission, effect }));
    saveMutation.mutate({ memberId, grants });

    const roleId = localRole[memberId];
    if (roleId !== undefined) {
      assignRoleMutation.mutate({ memberId, roleId: roleId || null });
    }
  };

  const hasChanges = (memberId: string) => {
    if (memberId in localRole) return true;
    const current = localOverrides[memberId];
    if (!current) return false;
    const stored = allPerms[memberId] || {};
    const storedKeys = Object.keys(stored);
    const currentKeys = Object.keys(current);
    if (storedKeys.length !== currentKeys.length) return true;
    for (const key of currentKeys) {
      const storedEntry = stored[key]?.[0]?.effect;
      if (storedEntry !== current[key]) return true;
    }
    return false;
  };

  const effectLabel = (effect: 'allow' | 'deny') => effect === 'allow' ? (fa ? 'اجازه' : 'Allow') : (fa ? 'ممنوع' : 'Deny');
  const effectColor = (effect: 'allow' | 'deny') => effect === 'allow' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20';

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Shield size={24} />
          {fa ? 'مدیریت دسترسی‌ها' : 'Permissions'}
        </h1>
        <p className="page-subtitle">
          {fa
            ? 'نقش و دسترسی‌های هر عضو را در این سفر مدیریت کنید.'
            : 'Manage what each member can do in this trip.'}
        </p>
      </div>

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

      <div className="space-y-3">
        {nonAdminMembers.map((member) => {
          const isOpen = expandedMember === member.id;
          const overrides = getMemberOverrides(member.id);
          const selectedRoleId = getMemberRoleId(member.id);
          const pendingChanges = hasChanges(member.id);
          const currentRoleId = selectedRoleId !== undefined ? selectedRoleId : (member as any).custom_role_id || null;

          return (
            <Card key={member.id} className="shadow-sm">
              <button
                type="button"
                onClick={() => {
                  if (isOpen) {
                    setExpandedMember(null);
                    setLocalOverrides(prev => { const next = { ...prev }; delete next[member.id]; return next; });
                    setLocalRole(prev => { const next = { ...prev }; delete next[member.id]; return next; });
                  } else {
                    setExpandedMember(member.id);
                  }
                }}
                className="flex w-full items-center justify-between p-4 text-start"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={member.avatar} name={member.display_name} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{member.display_name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      {currentRoleId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {roles.find(r => r.id === currentRoleId)?.name || currentRoleId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {Object.keys(overrides).length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(overrides).length} {fa ? 'تغییر' : 'overrides'}
                    </span>
                  )}
                  {isOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <CardContent className="pt-0">
                  {memberPermsRes === undefined ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
                  ) : (
                    <div className="space-y-5">
                      {/* Role Assignment */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-muted-foreground" />
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {fa ? 'نقش' : 'Role'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => setLocalRole(prev => ({ ...prev, [member.id]: null }))}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-start transition ${
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
                              onClick={() => setLocalRole(prev => ({ ...prev, [member.id]: role.id }))}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-start transition ${
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
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {fa ? 'تغییرات دسترسی' : 'Permission Overrides'}
                        </p>
                        {groups.map((group) => {
                          const groupPerms = registry.filter(p => p.group === group);
                          return (
                            <div key={group}>
                              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                {group}
                              </p>
                              <div className="grid gap-0.5">
                                {groupPerms.map((perm) => {
                                  const effect = overrides[perm.key];
                                  return (
                                    <button
                                      key={perm.key}
                                      type="button"
                                      onClick={() => toggleOverride(member.id, perm.key, effect)}
                                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition text-start ${
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
                                        <div className="flex items-center gap-1 shrink-0">
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

                      <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setExpandedMember(null);
                            setLocalOverrides(prev => { const next = { ...prev }; delete next[member.id]; return next; });
                            setLocalRole(prev => { const next = { ...prev }; delete next[member.id]; return next; });
                          }}
                        >
                          {fa ? 'لغو' : 'Cancel'}
                        </Button>
                        <Button
                          loading={saveMutation.isPending || assignRoleMutation.isPending}
                          disabled={!pendingChanges}
                          onClick={() => handleSave(member.id)}
                        >
                          <Save size={16} className="me-1.5" />
                          {fa ? 'ذخیره' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {nonAdminMembers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {fa ? 'عضو دیگری وجود ندارد.' : 'No other members in this trip.'}
          </p>
        )}
      </div>
    </div>
  );
}
