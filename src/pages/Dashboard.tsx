import { useQuery } from '@tanstack/react-query';
import { dashboardApi, withdrawalsApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowRight, Wallet, TrendingUp, TrendingDown, Users, DollarSign, LayoutGrid, List } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardSkeleton } from '../components/Skeleton';
import ExpenseTimeline from '../components/ExpenseTimeline';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CATEGORY_FA: Record<string, string> = {
  Food: 'غذا',
  Accommodation: 'اقامت',
  Transport: 'حمل‌ونقل',
  Activities: 'تفریحات',
  Other: 'سایر',
};

const fmt = (v: number) =>
  `${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


export default function Dashboard() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const { user } = useAuth();
  const [memberView, setMemberView] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'table' : 'card'
  );

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL}/dashboard`,
      {
        credentials: "include",
      }
    )
      .then(async (r) => {
        console.log("fetch status", r.status);
        console.log(await r.text());
      })
      .catch(console.error);
  }, []);

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get
  });

  const { data: withdrawalsRes, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: withdrawalsApi.getAll,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        {fa ? 'دریافت اطلاعات داشبورد با مشکل مواجه شد.' : 'Failed to load dashboard data.'}
      </div>
    );

  const data = res?.data;
  if (!data) return null;

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-6 pb-4">

      <div>
        <h1 className="page-title">
          {fa ? 'داشبورد سفر' : 'Trip dashboard'}
        </h1>

        <p className="page-subtitle">
          {fa
            ? 'اینجا می‌تونی وضعیت هزینه‌ها و حساب‌های سفر رو ببینی.'
            : 'A clear view of your shared trip budget.'}
        </p>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-center">

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'موجودی حساب' : 'Bank Balance'}
            </CardTitle>
            <Wallet className="w-5 h-5 text-indigo-600" />
          </CardHeader>

          <CardContent>
          <div className="text-2xl font-bold text-foreground " dir='ltr'>
          
            {fmt(data.currentBankBalance)}

          </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'کل واریزی‌ها' : 'Total Deposits'}
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fmt(data.totalDeposits)}
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'کل خرج‌ها' : 'Total Withdrawals'}
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fmt(data.totalWithdrawals)}
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm ">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'اعضای فعال' : 'Active Members'}
            </CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>

          <CardContent >
          <div className=" text-2xl font-medium text-foreground">
            {data.members.length}
          </div>
          </CardContent>
        </Card>

      </div>


      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {fa ? 'وضعیت حساب اعضا' : 'Member Financial Breakdown'}
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setMemberView('card')}
                className={`rounded-lg p-2 transition ${memberView === 'card' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                aria-label={fa ? 'نمایش کارتی' : 'Card view'}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setMemberView('table')}
                className={`rounded-lg p-2 transition ${memberView === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                aria-label={fa ? 'نمایش جدولی' : 'Table view'}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {memberView === 'table' ? (
            <Table>
              <Thead>
                <Tr>
                  <Th>{fa ? 'نام عضو' : 'Member Name'}</Th>
                  <Th>{fa ? 'کل واریزی' : 'Total Deposited'}</Th>
                  <Th>{fa ? 'کل هزینه‌ها' : 'Total Consumed'}</Th>
                  <Th>{fa ? 'مانده حساب' : 'Net Balance'}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.members.map((m) => {
                  const isCurrentUser = user?.id === m.member_id;
                  return (
                    <Tr key={m.member_id} className={isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''}>
                      <Td className="font-medium text-gray-900">{m.display_name || m.name}</Td>
                      <Td className="text-green-600 font-semibold">{fmt(m.total_deposited)}</Td>
                      <Td className="text-red-600 font-semibold">{fmt(m.total_expenses)}</Td>
                      <Td className={`font-bold ${m.balance > 0 ? 'text-indigo-600' : m.balance < 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {m.balance < 0 ? '-' : '+'}{fmt(Math.abs(m.balance))}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.members.map((m) => {
                const isCurrentUser = user?.id === m.member_id;
                return (
                  <div key={m.member_id} className={`rounded-xl border bg-card/60 p-4 shadow-sm ${isCurrentUser ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold text-foreground">{m.display_name || m.name}</p>
                      <span className={`text-sm font-bold ${m.balance > 0 ? 'text-indigo-600' : m.balance < 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {m.balance < 0 ? '-' : '+'}{fmt(Math.abs(m.balance))}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <span className="text-green-600">
                        {fa ? 'واریزی:' : 'Deposited:'} {fmt(m.total_deposited)}
                      </span>
                      <span className="text-red-600">
                        {fa ? 'هزینه:' : 'Spent:'} {fmt(m.total_expenses)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>


      <div className="grid gap-4 md:grid-cols-2">

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {fa ? 'هزینه خالص اعضا' : 'Member Net Expenses'}
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
  <div dir="ltr" className="w-full h-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.members}>
                <XAxis dataKey="name" />
                <YAxis />

                <Tooltip
                  formatter={(val: any) => [
                    fmt(Number(val)),
                    fa ? 'هزینه خالص' : 'Net Expenses'
                  ]}
                />

                <Bar dataKey="total_expenses" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {fa ? 'هزینه‌ها بر اساس دسته‌بندی' : 'Expenses by Category'}
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
  <div dir="ltr" className="w-full h-full min-h-[250px]">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>

                <Pie
                  data={data.categories}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  innerRadius="40%"
                  label={({name, percent}) =>
                    `${fa ? (CATEGORY_FA[name] || name) : name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.categories.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(val:any)=>[
                    fmt(Number(val)),
                    fa ? 'هزینه' : 'Spent'
                  ]}
                />

                <Legend />

                </PieChart>
    </ResponsiveContainer>
  </div>
</CardContent>
        </Card>

      </div>


      <ExpenseTimeline
        withdrawals={withdrawalsRes?.data}
        loading={isLoadingWithdrawals}
      />


      <Card className="shadow-sm">

        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />

            {fa ? 'پیشنهاد تسویه حساب' : 'Suggested Settlements'}

          </CardTitle>
        </CardHeader>


        <CardContent>

          {data.settlements.length === 0 ? (

            <p className="text-sm text-gray-500 py-4 text-center">
              {
                fa
                  ? 'همه حساب‌ها صاف شده! نیازی به انتقال پول نیست.'
                  : 'All balances are completely settled up! No transfers required.'
              }
            </p>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {data.settlements.map((s,i)=>{

                const bgColors = [
                  'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200/60',
                  'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60',
                  'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/60',
                  'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60',
                  'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/60',
                  'bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-200/60',
                ];
                const textColors = [
                  'text-indigo-700',
                  'text-emerald-700',
                  'text-violet-700',
                  'text-amber-700',
                  'text-rose-700',
                  'text-cyan-700',
                ];
                const arrowColors = [
                  'text-indigo-500',
                  'text-emerald-500',
                  'text-violet-500',
                  'text-amber-500',
                  'text-rose-500',
                  'text-cyan-500',
                ];

                return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${bgColors[i % bgColors.length]}`}
                >

                  <div className="flex items-center gap-2 min-w-0">

                    <span className="font-semibold text-gray-900 truncate">
                      {s.fromName}
                    </span>

                    <ArrowRight
                      className={`w-4 h-4 shrink-0 ${arrowColors[i % arrowColors.length]} ${
                        fa ? 'rotate-180' : ''
                      }`}
                    />

                    <span className="font-semibold text-gray-900 truncate">
                      {s.toName}
                    </span>

                  </div>

                  <span className={`text-base font-bold shrink-0 ms-3 ${textColors[i % textColors.length]}`}>
                    {fmt(s.amount)}
                  </span>

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