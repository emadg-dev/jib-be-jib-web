import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositsApi, membersApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button, Input } from '../components/ui/core';

export default function Deposits() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState('');

  const { data: deposits } = useQuery({ queryKey: ['deposits'], queryFn: depositsApi.getAll });
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: membersApi.getAll });

  const createMutation = useMutation({
    mutationFn: depositsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAmount(''); setNote('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: depositsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deposits'] })
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !amount) return;
    createMutation.mutate({ member_id: memberId, amount: parseFloat(amount), note });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Deposits</h1><p className="page-subtitle">Log contributions and keep the shared budget current.</p></div>

      <Card>
        <CardHeader><CardTitle>Add New Deposit</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="form-grid items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Member</label>
              <select className="select-control" value={memberId} onChange={e => setMemberId(e.target.value)} required>
                <option value="">Select Member</option>
                {members?.data?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Note (Optional)</label>
              <Input value={note} onChange={e => setNote(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" className="w-full xl:w-auto">Add Deposit</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <Thead><Tr><Th>Date</Th><Th>Member</Th><Th>Note</Th><Th>Amount</Th><Th>Action</Th></Tr></Thead>
            <Tbody>
              {deposits?.data?.map(d => (
                <Tr key={d.id}>
                  <Td>{new Date(d.created_at).toLocaleDateString()}</Td>
                  <Td>{d.member_name}</Td>
                  <Td>{d.note || '-'}</Td>
                  <Td className="font-medium text-green-600">${d.amount.toFixed(2)}</Td>
                  <Td><Button variant="destructive" onClick={() => deleteMutation.mutate(d.id)}>Delete</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}