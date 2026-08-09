import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button, Input, Label, Select, Checkbox } from '../components/ui/core';
import { useForm } from 'react-hook-form';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import { useState } from 'react';
import { Eye, EyeOff, Pencil, LayoutGrid, List, Plus } from 'lucide-react';
import { PageSkeleton } from '../components/Skeleton';

export default function Members() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const confirm = useConfirm();
  const { isOwner, user } = useAuth();

  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'table' : 'card'
  );
  const [showForm, setShowForm] = useState(false);

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue
  } = useForm<any>({ defaultValues: { role: 'member', active: true } });


  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      reset();
      setShowForm(false);
    }
  });


  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const { id, password, ...member } = data;
      return membersApi.update(id, { ...member, ...(password ? { password } : {}) });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      reset();
      setEditingMember(null);
    }
  });


  const deleteMutation = useMutation({
    mutationFn: membersApi.delete,

    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['members'] })
  });


  const onSubmit = (data: any) => {

    if (editingMember) {
      updateMutation.mutate({
        id: editingMember.id,
        ...data
      });
    }
    else {
      createMutation.mutate({ ...data, active: Boolean(data.active) });
    }

  };

  const submitting = createMutation.isPending || updateMutation.isPending;


  const editMember = (member: any) => {

    setEditingMember(member);

    setValue('name', member.name);
    setValue('display_name', member.display_name || member.name);
    setValue('role', member.role);
    setValue('active', member.active !== false);
    setValue('password', '');

  };


  const cancelEdit = () => {
    setEditingMember(null);
    reset();
    setShowForm(false);
  };


  if (isLoadingMembers) return <div dir={fa ? 'rtl' : 'ltr'}><PageSkeleton /></div>;

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6">

      <div>
        <h1 className="page-title">
          {fa ? 'اعضا' : 'Members'}
        </h1>

        <p className="page-subtitle">
          {
            fa
              ? 'اینجا می‌تونی افرادی که توی سفر هستن رو مدیریت کنی.'
              : 'Manage who can contribute to the trip.'
          }
        </p>
      </div>


      {isOwner && !showForm && !editingMember && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus size={18} className="me-1" />
          {fa ? 'افزودن عضو جدید' : 'Add new member'}
        </Button>
      )}

      {isOwner && (showForm || editingMember) && <Card>

        <CardHeader>
          <CardTitle>
            {
              editingMember
                ? (fa ? 'ویرایش عضو' : 'Edit member')
                : (fa ? 'افزودن عضو' : 'Add member')
            }
          </CardTitle>
        </CardHeader>


        <CardContent>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="form-grid sm:grid-cols-2 xl:grid-cols-3"
          >

            <div>
              <Label htmlFor="member-name">
                {fa ? 'نام' : 'Name'}
              </Label>

              <Input id="member-name" {...register('name', { required: true })} placeholder={fa ? 'نام کاربری یکتا' : 'Unique login username'} />

            </div>

            <div>
              <Label htmlFor="member-display">{fa ? 'نام نمایشی' : 'Display name'}</Label>
              <Input id="member-display" {...register('display_name', { required: true })} />
            </div>

            <div>
              <Label htmlFor="member-password">
                {fa ? 'رمز عبور' : 'Password'}
              </Label>

              <div className="relative">
                <Input
                  id="member-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="pe-10"
                  placeholder={
                    editingMember
                      ? (fa ? 'خالی بگذارید بدون تغییر بماند' : 'Leave empty to keep current')
                      : ''
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="member-role">
                {fa ? 'نقش' : 'Role'}
              </Label>

              <Select id="member-role" {...register('role')}>
                <option value="member">
                  {fa ? 'عضو' : 'Member'}
                </option>

                <option value="owner">
                  {fa ? 'مدیر' : 'Owner'}
                </option>
              </Select>
            </div>

            <div className="flex items-end pb-1">
              <Checkbox {...register('active')}>
                {fa ? 'عضو فعال' : 'Active member'}
              </Checkbox>
            </div>

            <div className="flex flex-wrap items-end gap-2 pb-1">
              <Button type="submit" loading={submitting}>
                {
                  editingMember
                    ? (fa ? 'ذخیره تغییرات' : 'Save changes')
                    : (fa ? 'افزودن عضو' : 'Add member')
                }
              </Button>

              {
                editingMember &&
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
                >
                  {fa ? 'لغو' : 'Cancel'}
                </Button>
              }
            </div>

          </form>

        </CardContent>

      </Card>}



      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-end gap-1 mt-3">
            <button
              onClick={() => setViewMode('card')}
              className={`rounded-lg p-2 transition ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              aria-label={fa ? 'نمایش کارتی' : 'Card view'}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-2 transition ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              aria-label={fa ? 'نمایش جدولی' : 'Table view'}
            >
              <List size={18} />
            </button>
          </div>

          {viewMode === 'table' ? (
            <Table>
              <Thead>
                <Tr>
                  <Th>{fa ? 'نام نمایشی' : 'Display name'}</Th>
                  <Th>{fa ? 'نام کاربری' : 'Username'}</Th>
                  <Th>{fa ? 'نقش' : 'Role'}</Th>
                  <Th>{fa ? 'تاریخ عضویت' : 'Joined'}</Th>
                  {isOwner && <Th>{fa ? 'عملیات' : 'Action'}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {members?.data?.map(m => {
                  const isCurrentUser = user?.id === m.id;
                  return (
                    <Tr key={m.id} className={isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''}>
                      <Td className="font-medium">{m.display_name || m.name}</Td>
                      <Td className="text-slate-500">{m.name}</Td>
                      <Td className="capitalize">
                        {m.role}{m.active === false && <span className="ms-2 text-xs text-amber-600">{fa ? 'غیرفعال' : 'Inactive'}</span>}
                      </Td>
                      <Td>{new Date(m.created_at).toLocaleDateString()}</Td>
                    {isOwner && (
                      <Td>
                        <div className="flex gap-2">
                           <Button variant="secondary" onClick={() => { editMember(m); setShowForm(true); }}>
                            <Pencil size={16} />{fa ? 'ویرایش' : 'Edit'}
                          </Button>
                          {m.role !== 'owner' && (
                            <Button
                              variant="destructive"
                              loading={deletingId === m.id}
                              disabled={deletingId === m.id}
                              onClick={async () => {
                                if (deletingId) return;
                                if (!await confirm(
                                  fa ? 'حذف عضو' : 'Delete member',
                                  fa ? 'از حذف این عضو مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this member? This action cannot be undone.'
                                )) return;
                                try { setDeletingId(m.id); await deleteMutation.mutateAsync(m.id); } finally { setDeletingId(null); }
                              }}
                            >{fa ? 'حذف' : 'Remove'}</Button>
                          )}
                        </div>
                      </Td>
                    )}
                  </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {members?.data?.map(m => {
                const isCurrentUser = user?.id === m.id;
                return (
                  <div key={m.id} className={`rounded-xl border bg-card/60 p-4 shadow-sm ${isCurrentUser ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{m.display_name || m.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">@{m.name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${m.role === 'owner' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {m.role === 'owner' ? (fa ? 'مدیر' : 'Owner') : (fa ? 'عضو' : 'Member')}
                      </span>
                    </div>
                    {m.active === false && (
                      <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {fa ? 'غیرفعال' : 'Inactive'}
                      </span>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {fa ? 'عضویت:' : 'Joined:'} {new Date(m.created_at).toLocaleDateString()}
                    </p>
                    {isOwner && (
                      <div className="mt-3 flex gap-2 border-t border-border pt-3">
                         <Button variant="outline" size="sm" onClick={() => { editMember(m); setShowForm(true); }}>
                          <Pencil size={14} className="me-1" />{fa ? 'ویرایش' : 'Edit'}
                        </Button>
                        {m.role !== 'owner' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            loading={deletingId === m.id}
                            disabled={deletingId === m.id}
                            onClick={async () => {
                              if (deletingId) return;
                              if (!await confirm(
                                fa ? 'حذف عضو' : 'Delete member',
                                fa ? 'از حذف این عضو مطمئنی؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this member? This action cannot be undone.'
                              )) return;
                              try { setDeletingId(m.id); await deleteMutation.mutateAsync(m.id); } finally { setDeletingId(null); }
                            }}
                          >{fa ? 'حذف' : 'Remove'}</Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}