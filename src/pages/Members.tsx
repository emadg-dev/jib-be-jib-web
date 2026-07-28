import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button, Input } from '../components/ui/core';
import { useForm } from 'react-hook-form';
import { usePreferences } from '../contexts/PreferencesContext';

export default function Members() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const queryClient = useQueryClient();
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: membersApi.getAll });
  const { register, handleSubmit, reset } = useForm();

  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      reset();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: membersApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] })
  });

  const onSubmit = (data: any) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">{fa ? 'اعضا' : 'Members'}</h1><p className="page-subtitle">{fa ? 'افراد مشارکت‌کننده در سفر را مدیریت کنید.' : 'Manage who can contribute to the trip.'}</p></div>

      <Card>
        <CardHeader><CardTitle>{fa ? 'افزودن عضو' : 'Add member'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="form-grid items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">{fa ? 'نام' : 'Name'}</label>
              <Input {...register('name', { required: true })} className="mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">{fa ? 'رمز عبور موقت' : 'Temporary password'}</label>
              <Input type="password" {...register('password', { required: true })} className="mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">{fa ? 'نقش' : 'Role'}</label>
              <select {...register('role')} className="select-control">
                <option value="member">{fa ? 'عضو' : 'Member'}</option>
                <option value="owner">{fa ? 'مدیر' : 'Owner'}</option>
              </select>
            </div>
            <Button type="submit" className="w-full xl:w-auto">{fa ? 'افزودن عضو' : 'Add member'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <Thead><Tr><Th>{fa ? 'نام' : 'Name'}</Th><Th>{fa ? 'نقش' : 'Role'}</Th><Th>{fa ? 'تاریخ عضویت' : 'Joined'}</Th><Th>{fa ? 'عملیات' : 'Action'}</Th></Tr></Thead>
            <Tbody>
              {members?.data?.map(m => (
                <Tr key={m.id}>
                  <Td className="font-medium">{m.name}</Td>
                  <Td className="capitalize">{m.role}</Td>
                  <Td>{new Date(m.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {m.role !== 'owner' && (
                      <Button variant="destructive" onClick={() => deleteMutation.mutate(m.id)}>{fa ? 'حذف' : 'Remove'}</Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}