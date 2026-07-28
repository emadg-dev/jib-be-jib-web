import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalsApi, membersApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button, Input } from '../components/ui/core';

export default function Withdrawals() {
  const queryClient = useQueryClient();
  const { data: withdrawals } = useQuery({ queryKey: ['withdrawals'], queryFn: withdrawalsApi.getAll });
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: membersApi.getAll });

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: withdrawalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDescription(''); setCategory(''); setAmount(''); setSelectedMembers([]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: withdrawalsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(amount);
    if (!totalAmount || selectedMembers.length === 0) return alert("Fill all fields & select beneficiaries");
    
    // Split equally
    const share = Number((totalAmount / selectedMembers.length).toFixed(2));
    // Handle precision remainder
    const beneficiaries = selectedMembers.map((id, index) => ({
      member_id: id,
      share: index === 0 ? share + (totalAmount - (share * selectedMembers.length)) : share
    }));

    createMutation.mutate({ description, category, amount: totalAmount, beneficiaries });
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Expenses</h1><p className="page-subtitle">Record shared costs and split them fairly.</p></div>

      <Card>
        <CardHeader><CardTitle>Record Expense</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="flex-1">
                <label className="text-sm font-medium">Description</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Category</label>
                <select className="select-control" value={category} onChange={e => setCategory(e.target.value)} required>
                  <option value="">Select Category</option>
                  <option value="Food">Food</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Transport">Transport</option>
                  <option value="Activities">Activities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Total Amount</label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Split Among (Equally)</label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {members?.data?.map(m => (
                  <label key={m.id} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/80 bg-white/50 p-3 text-sm font-medium text-slate-700 cursor-pointer transition hover:bg-white">
                    <input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={() => toggleMember(m.id)} className="h-4 w-4" />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto">Record expense</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <Thead><Tr><Th>Date</Th><Th>Description</Th><Th>Category</Th><Th>Split Among</Th><Th>Amount</Th><Th>Action</Th></Tr></Thead>
            <Tbody>
              {withdrawals?.data?.map(w => (
                <Tr key={w.id}>
                  <Td>{new Date(w.created_at).toLocaleDateString()}</Td>
                  <Td>{w.description}</Td>
                  <Td>{w.category}</Td>
                  <Td>{w.beneficiaries.map(b => b.member_name).join(', ')}</Td>
                  <Td className="font-medium text-red-600">${w.amount.toFixed(2)}</Td>
                  <Td><Button variant="destructive" onClick={() => deleteMutation.mutate(w.id)}>Delete</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}