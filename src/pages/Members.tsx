import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button, Input } from '../components/ui/core';
import { useForm } from 'react-hook-form';

export default function Members() {
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
      <div><h1 className="page-title">Members</h1><p className="page-subtitle">Manage who can contribute to the trip.</p></div>

      <Card>
        <CardHeader><CardTitle>Add Member</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="form-grid items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Name</label>
              <Input {...register('name', { required: true })} className="mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Temporary Password</label>
              <Input type="password" {...register('password', { required: true })} className="mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Role</label>
              <select {...register('role')} className="select-control">
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <Button type="submit" className="w-full xl:w-auto">Add Member</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <Thead><Tr><Th>Name</Th><Th>Role</Th><Th>Joined</Th><Th>Action</Th></Tr></Thead>
            <Tbody>
              {members?.data?.map(m => (
                <Tr key={m.id}>
                  <Td className="font-medium">{m.name}</Td>
                  <Td className="capitalize">{m.role}</Td>
                  <Td>{new Date(m.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {m.role !== 'owner' && (
                      <Button variant="destructive" onClick={() => deleteMutation.mutate(m.id)}>Remove</Button>
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