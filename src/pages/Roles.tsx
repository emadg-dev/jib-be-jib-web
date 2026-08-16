import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, permissionsApi, type TripRole, type PermissionDefinition } from '../api/services';
import { Card, CardContent, Button, Input, Label } from '../components/ui/core';
import { usePreferences } from '../contexts/PreferencesContext';
import { useConfirm } from '../components/ConfirmDialog';
import { useState } from 'react';
import { translateError } from '../utils/translations';
import { ShieldPlus, X, Trash2, Save, Edit3, Crown, User, ChevronDown, ChevronUp } from 'lucide-react';
import { PageSkeleton } from '../components/Skeleton';

const BUILTIN_ROLES = [
  { id: '__owner', nameKey: { en: 'Owner', fa: 'مالک' }, descKey: { en: 'Full access to all features', fa: 'دسترسی کامل به تمام امکانات' }, icon: Crown },
  { id: '__member', nameKey: { en: 'Member', fa: 'عضو' }, descKey: { en: 'Basic member permissions', fa: 'دسترسی‌های پایه عضو' }, icon: User },
];

export default function RolesPage() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showSuccess = (msg: string) => { setMessage(msg); setError(''); };
  const showError = (err: any) => {
    const raw = err?.message || 'Something went wrong';
    setError(translateError(raw, fa));
    setMessage('');
  };

  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPerms, setFormPerms] = useState<Set<string>>(new Set());
  const [baseRoleId, setBaseRoleId] = useState<string | null>(null);
  const [expandedBuiltins, setExpandedBuiltins] = useState(false);

  const { data: rolesRes, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const { data: registryRes } = useQuery({
    queryKey: ['permissions', 'registry'],
    queryFn: permissionsApi.getRegistry,
  });

  const { data: rolePermsRes } = useQuery({
    queryKey: ['roles', 'permissions'],
    queryFn: rolesApi.getPermissions,
  });

  const registry: PermissionDefinition[] = registryRes?.data?.permissions || [];
  const groups = [...new Set(registry.map(p => p.group))];
  const rolePerms: Record<string, string[]> = rolePermsRes?.data || {};
  const roles: TripRole[] = rolesRes?.data || [];

  const MEMBER_DEFAULTS = [
    'dashboard.view', 'member.view', 'deposit.view', 'withdrawal.create',
    'withdrawal.view', 'settlement.view', 'ratings.view', 'ratings.submit',
  ];

  const getBasePerms = (id: string): Set<string> => {
    if (id === '__owner') return new Set(registry.map(p => p.key));
    if (id === '__member') return new Set(MEMBER_DEFAULTS);
    return new Set(rolePerms[id] || []);
  };

  const applyBaseRole = (id: string | null) => {
    setBaseRoleId(id);
    if (id) {
      setFormPerms(getBasePerms(id));
    } else {
      setFormPerms(new Set());
    }
  };

  const createMutation = useMutation({
    mutationFn: () => rolesApi.create({ name: formName, description: formDesc || undefined, permissions: Array.from(formPerms) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', 'permissions'] });
      resetForm();
      showSuccess(fa ? 'نقش با موفقیت ایجاد شد.' : 'Role created successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, name, description, permissions }: { roleId: string; name: string; description: string | null; permissions: string[] }) =>
      rolesApi.update(roleId, { name, description, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', 'permissions'] });
      resetForm();
      showSuccess(fa ? 'نقش با موفقیت ویرایش شد.' : 'Role updated successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => rolesApi.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', 'permissions'] });
      showSuccess(fa ? 'نقش با موفقیت حذف شد.' : 'Role deleted successfully.');
    },
    onError: (err: any) => showError(err),
  });

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormPerms(new Set());
    setBaseRoleId(null);
    setEditingRole(null);
    setShowCreate(false);
  };

  const startEdit = (role: TripRole) => {
    setEditingRole(role.id);
    setFormName(role.name);
    setFormDesc(role.description || '');
    setFormPerms(new Set(rolePerms[role.id] || []));
    setBaseRoleId(null);
    setShowCreate(false);
  };

  const togglePerm = (key: string) => {
    setFormPerms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setGroup = (group: string, on: boolean) => {
    const groupPerms = registry.filter(p => p.group === group);
    setFormPerms(prev => {
      const next = new Set(prev);
      groupPerms.forEach(p => { if (on) next.add(p.key); else next.delete(p.key); });
      return next;
    });
  };

  if (loadingRoles) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldPlus size={24} />
            {fa ? 'مدیریت نقش‌ها' : 'Roles'}
          </h1>
          <p className="page-subtitle">
            {fa
              ? 'نقش‌های سفارشی بسازید و دسترسی‌ها را به اعضا اختصاص دهید.'
              : 'Create custom roles and assign permissions to members.'}
          </p>
        </div>
        {!showCreate && !editingRole && (
          <Button onClick={() => setShowCreate(true)} className="shrink-0">
            <span className="text-lg leading-none me-1">+</span> {fa ? 'نقش جدید' : 'New Role'}
          </Button>
        )}
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

      {/* Create / Edit form */}
      {(showCreate || editingRole) && (
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {editingRole ? (fa ? 'ویرایش نقش' : 'Edit Role') : (fa ? 'نقش جدید' : 'New Role')}
              </h3>
              <button onClick={resetForm} className="p-1 rounded-lg hover:bg-accent">
                <X size={16} />
              </button>
            </div>

            {/* Base role picker */}
            <div className="space-y-2">
              <Label>{fa ? 'نقش پایه (اختیاری)' : 'Base role (optional)'}</Label>
              <p className="text-xs text-muted-foreground">
                {fa ? 'دسترسی‌های نقش پایه به عنوان نقطه شروع کپی می‌شوند.' : 'Copy permissions from an existing role as a starting point.'}
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {BUILTIN_ROLES.map(br => {
                  const Icon = br.icon;
                  return (
                    <button
                      key={br.id}
                      type="button"
                      onClick={() => applyBaseRole(baseRoleId === br.id ? null : br.id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-start transition ${
                        baseRoleId === br.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700'
                          : 'hover:bg-accent text-muted-foreground'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="truncate">{fa ? br.nameKey.fa : br.nameKey.en}</span>
                    </button>
                  );
                })}
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => applyBaseRole(baseRoleId === role.id ? null : role.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-start transition ${
                      baseRoleId === role.id
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700'
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <ShieldPlus size={14} />
                    <span className="truncate">{role.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-name">{fa ? 'نام' : 'Name'}</Label>
              <Input
                id="role-name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={fa ? 'مثلاً: مسئول مالی' : 'e.g. Finance Manager'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc">{fa ? 'توضیحات' : 'Description'}</Label>
              <Input
                id="role-desc"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder={fa ? 'توضیح کوتاه (اختیاری)' : 'Short description (optional)'}
              />
            </div>

            <div className="space-y-3">
              <Label>{fa ? 'دسترسی‌ها' : 'Permissions'}</Label>
              {groups.map(group => {
                const groupPerms = registry.filter(p => p.group === group);
                const selectedCount = groupPerms.filter(p => formPerms.has(p.key)).length;
                const allSelected = selectedCount === groupPerms.length;
                const someSelected = selectedCount > 0 && !allSelected;
                return (
                  <div key={group} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setGroup(group, !allSelected)}
                      className={`w-full text-left flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                        allSelected ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : someSelected ? 'text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span>{group}</span>
                      <span className="text-[10px]">{selectedCount}/{groupPerms.length}</span>
                    </button>
                    <div className="grid gap-0.5 ps-2">
                      {groupPerms.map(perm => {
                        const selected = formPerms.has(perm.key);
                        return (
                          <button
                            key={perm.key}
                            type="button"
                            onClick={() => togglePerm(perm.key)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition text-start ${
                              selected
                                ? 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
                                : 'text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            <span className="text-xs">{fa ? perm.label.fa : perm.label.en}</span>
                            <span className="text-[10px] opacity-60 hidden sm:inline">{fa ? perm.description.fa : perm.description.en}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="secondary" onClick={resetForm}>
                {fa ? 'لغو' : 'Cancel'}
              </Button>
              <Button
                loading={createMutation.isPending || updateMutation.isPending}
                disabled={!formName.trim()}
                onClick={() => {
                  if (editingRole) {
                    updateMutation.mutate({ roleId: editingRole, name: formName, description: formDesc || null, permissions: Array.from(formPerms) });
                  } else {
                    createMutation.mutate();
                  }
                }}
              >
                <Save size={16} className="me-1.5" />
                {editingRole ? (fa ? 'ذخیره' : 'Save') : (fa ? 'ایجاد' : 'Create')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Built-in roles */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setExpandedBuiltins(!expandedBuiltins)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {expandedBuiltins ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {fa ? 'نقش‌های پیش‌فرض' : 'Built-in Roles'}
        </button>
        {expandedBuiltins && (
          <div className="space-y-2 ps-5">
            {BUILTIN_ROLES.map(br => {
              const Icon = br.icon;
              const perms = br.id === '__owner' ? registry.map(p => p.key) : MEMBER_DEFAULTS;
              return (
                <Card key={br.id} className="shadow-sm">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid place-items-center w-8 h-8 rounded-lg bg-muted">
                        <Icon size={16} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{fa ? br.nameKey.fa : br.nameKey.en}</p>
                        <p className="text-xs text-muted-foreground">{fa ? br.descKey.fa : br.descKey.en}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    {perms.slice(0, 12).map(p => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {p}
                      </span>
                    ))}
                    {perms.length > 12 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        +{perms.length - 12}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom roles */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {fa ? 'نقش‌های سفارشی' : 'Custom Roles'}
        </p>
        {roles.map(role => {
          const perms = rolePerms[role.id] || [];
          const isEditing = editingRole === role.id;
          return (
            <Card key={role.id} className={`shadow-sm ${isEditing ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{role.name}</p>
                  {role.description && (
                    <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {perms.length} {fa ? 'دسترسی' : 'permissions'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(role)}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm(
                        fa ? 'حذف نقش' : 'Delete role',
                        fa ? 'این نقش حذف شود؟' : 'Delete this role?'
                      )) {
                        deleteMutation.mutate(role.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {perms.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {perms.slice(0, 10).map(p => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {p}
                    </span>
                  ))}
                  {perms.length > 10 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      +{perms.length - 10}
                    </span>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {roles.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {fa ? 'هنوز نقش سفارشی ساخته نشده.' : 'No custom roles created yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
