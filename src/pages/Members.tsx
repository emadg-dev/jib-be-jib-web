import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button, Input } from '../components/ui/core';
import { useForm } from 'react-hook-form';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Eye, EyeOff, Pencil } from 'lucide-react';

export default function Members() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { isOwner } = useAuth();

  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: members } = useQuery({
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
  };


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


      {isOwner && <Card>

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
            className="form-grid items-end"
          >

            <div className="flex-1">

              <label className="text-sm font-medium">
                {fa ? 'نام' : 'Name'}
              </label>

              <Input {...register('name', { required: true })} className="mt-1" placeholder={fa ? 'نام کاربری یکتا' : 'Unique login username'} />

            </div>


            <div className="flex-1"><label className="text-sm font-medium">{fa ? 'نام نمایشی' : 'Display name'}</label><Input {...register('display_name', { required: true })} className="mt-1" /></div>

            <div className="flex-1">
              <label className="text-sm font-medium">
                {fa ? 'رمز عبور' : 'Password'}
              </label>

              <div className="relative mt-1">
                <Input
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
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>


            <div className="flex-1">

              <label className="text-sm font-medium">
                {fa ? 'نقش' : 'Role'}
              </label>

              <select
                {...register('role')}
                className="select-control"
              >

                <option value="member">
                  {fa ? 'عضو' : 'Member'}
                </option>

                <option value="owner">
                  {fa ? 'مدیر' : 'Owner'}
                </option>

              </select>

            </div>

            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" {...register('active')} />{fa ? 'عضو فعال' : 'Active member'}</label>

            <div className="flex gap-2">

              <Button type="submit" className="w-full xl:w-auto" loading={submitting}>

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

              {
                members?.data?.map(m => (

                  <Tr key={m.id}>

                    <Td className="font-medium">
                      {m.display_name || m.name}
                    </Td>


                    <Td className="text-slate-500">
                      {m.name}
                    </Td>

                    <Td className="capitalize">
                      {m.role}{m.active === false && <span className="ms-2 text-xs text-amber-600">{fa ? 'غیرفعال' : 'Inactive'}</span>}
                    </Td>


                    <Td>
                      {new Date(m.created_at).toLocaleDateString()}
                    </Td>


                    {isOwner && <Td>

                      <div className="flex gap-2">

                        <Button
                          variant="secondary"
                          onClick={() => editMember(m)}
                        >
                          <Pencil size={16} />
                          {fa ? 'ویرایش' : 'Edit'}
                        </Button>


                        {
                          m.role !== 'owner' &&
                          <Button
                            variant="destructive"
                            loading={deletingId === m.id}
                            disabled={deletingId === m.id}
                            onClick={async () => {
                              if (deletingId) return;
                              try {
                                setDeletingId(m.id);
                                await deleteMutation.mutateAsync(m.id);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                          >
                            {fa ? 'حذف' : 'Remove'}
                          </Button>
                        }

                      </div>

                    </Td>}



                  </Tr>

                ))
              }

            </Tbody>

          </Table>

        </CardContent>

      </Card>


    </div>
  );
}