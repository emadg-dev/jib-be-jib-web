import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowRight, Wallet, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { language } = usePreferences();
  const fa = language === 'fa';

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">
        {fa ? 'در حال آماده کردن اطلاعات...' : 'Loading dashboard overview...'}
      </div>
    );

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


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'موجودی حساب' : 'Bank Balance'}
            </CardTitle>
            <Wallet className="w-5 h-5 text-indigo-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${data.currentBankBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>


        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'کل واریزی‌ها' : 'Total Deposits'}
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.totalDeposits.toFixed(2)}
            </div>
          </CardContent>
        </Card>


        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'کل خرج‌ها' : 'Total Withdrawals'}
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${data.totalWithdrawals.toFixed(2)}
            </div>
          </CardContent>
        </Card>


        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {fa ? 'اعضای فعال' : 'Active Members'}
            </CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.members.length}
            </div>
          </CardContent>
        </Card>

      </div>


      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {fa ? 'وضعیت حساب اعضا' : 'Member Financial Breakdown'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <Thead>
              <Tr>
                <Th>{fa ? 'نام عضو' : 'Member Name'}</Th>
                <Th className="text-right">{fa ? 'کل واریزی' : 'Total Deposited'}</Th>
                <Th className="text-right">{fa ? 'کل هزینه‌ها' : 'Total Consumed'}</Th>
                <Th className="text-right">{fa ? 'مانده حساب' : 'Net Balance'}</Th>
              </Tr>
            </Thead>

            <Tbody>
              {data.members.map((m) => (
                <Tr key={m.member_id}>
                  <Td className="font-medium text-gray-900">{m.name}</Td>

                  <Td className="text-right text-green-600 font-semibold">
                    ${m.total_deposited.toFixed(2)}
                  </Td>

                  <Td className="text-right text-red-600 font-semibold">
                    ${m.total_expenses.toFixed(2)}
                  </Td>

                  <Td className={`text-right font-bold ${
                    m.balance > 0
                      ? 'text-indigo-600'
                      : m.balance < 0
                        ? 'text-amber-600'
                        : 'text-gray-600'
                  }`}>
                    ${m.balance.toFixed(2)}
                  </Td>

                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>


      <div className="grid gap-4 md:grid-cols-2">

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {fa ? 'مانده حساب اعضا' : 'Member Net Balances'}
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
                    `$${Number(val).toFixed(2)}`,
                    fa ? 'مانده' : 'Balance'
                  ]}
                />

                <Bar dataKey="balance" fill="#4f46e5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {fa ? 'هزینه‌ها بر اساس دسته‌بندی' : 'Expenses by Category'}
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
  <div dir="ltr" className="w-full h-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>

                <Pie
                  data={data.categories}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({name, percent}) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.categories.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(val:any)=>[
                    `$${Number(val).toFixed(2)}`,
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


      <Card className="bg-white shadow-sm border border-gray-100">

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

              {data.settlements.map((s,i)=>(

                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-indigo-50/40 border border-indigo-100 shadow-sm"
                >

                  <div className="flex items-center gap-2">

                    <span className="font-semibold text-gray-900">
                      {s.fromName}
                    </span>

                    <ArrowRight className="w-4 h-4 text-indigo-600" />

                    <span className="font-semibold text-gray-900">
                      {s.toName}
                    </span>

                  </div>

                  <span className="text-base font-bold text-indigo-700">
                    ${s.amount.toFixed(2)}
                  </span>

                </div>

              ))}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}