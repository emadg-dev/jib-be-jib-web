import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { data: res, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  
  if (isLoading) return <div>Loading dashboard...</div>;
  const data = res?.data;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle>Bank Balance</CardTitle></CardHeader><CardContent className="text-2xl font-bold">${data.currentBankBalance.toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Deposits</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">${data.totalDeposits.toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Withdrawals</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-600">${data.totalWithdrawals.toFixed(2)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active Members</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{data.members.length}</CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Member Balances</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.members}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="balance" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                  {data.categories.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Suggested Settlements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <Thead><Tr><Th>From</Th><Th>To</Th><Th>Amount</Th></Tr></Thead>
            <Tbody>
              {data.settlements.length === 0 ? <Tr><Td colSpan={3} className="text-center text-muted-foreground">All settled up!</Td></Tr> : 
               data.settlements.map((s, i) => (
                <Tr key={i}><Td>{s.fromName}</Td><Td>{s.toName}</Td><Td className="font-medium">${s.amount.toFixed(2)}</Td></Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}