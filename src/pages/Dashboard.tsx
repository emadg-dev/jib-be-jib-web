import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardApi, withdrawalsApi, profileApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowRight, Wallet, TrendingUp, TrendingDown, Users, DollarSign, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardSkeleton } from '../components/Skeleton';
import ExpenseTimeline from '../components/ExpenseTimeline';
import Avatar from '../components/Avatar';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SECTION_KEYS = ['stats', 'memberBreakdown', 'memberNetExpenses', 'categoryBreakdown', 'timeline', 'settlements'] as const;
type SectionKey = typeof SECTION_KEYS[number];

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
  const { user, updateUser } = useAuth();
  const [memberView, setMemberView] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'table' : 'card'
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCustomizeOpen(false);
      }
    };
    if (customizeOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [customizeOpen]);

  const updatePrefsMutation = useMutation({
    mutationFn: profileApi.updatePreferences,
    onError: () => {},
  });

  const isVisible = (key: SectionKey) => user?.preferences?.[key] !== false;

  const toggleSection = (key: SectionKey) => {
    const newPrefs = { ...user?.preferences, [key]: !isVisible(key) };
    updateUser({ preferences: newPrefs });
    updatePrefsMutation.mutate(newPrefs);
  };

  const SECTION_LABELS: Record<SectionKey, { en: string; fa: string }> = {
    stats: { en: 'Stats overview', fa: 'خلاصه آماری' },
    memberBreakdown: { en: 'Member Financial Breakdown', fa: 'وضعیت حساب اعضا' },
    memberNetExpenses: { en: 'Member Net Expenses', fa: 'هزینه خالص اعضا' },
    categoryBreakdown: { en: 'Expenses by Category', fa: 'هزینه‌ها بر اساس دسته‌بندی' },
    timeline: { en: 'Expense Timeline', fa: 'خط زمانی هزینه‌ها' },
    settlements: { en: 'Suggested Settlements', fa: 'پیشنهاد تسویه حساب' },
  };

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

      <div className="flex items-start justify-between gap-3">
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

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setCustomizeOpen(!customizeOpen)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-card text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
            aria-label={fa ? 'سفارشی‌سازی داشبورد' : 'Customize dashboard'}
            title={fa ? 'سفارشی‌سازی داشبورد' : 'Customize dashboard'}
          >
            <SlidersHorizontal size={18} />
          </button>
          {customizeOpen && (
            <div className="absolute end-0 top-full z-30 mt-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-lg">
              <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                {fa ? 'بخش‌های نمایشی' : 'Visible sections'}
              </p>
              <div className="space-y-1">
                {SECTION_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible(key)}
                      onChange={() => toggleSection(key)}
                      className="h-4 w-4 rounded border-border accent-indigo-600"
                    />
                    <span className="text-foreground">{fa ? SECTION_LABELS[key].fa : SECTION_LABELS[key].en}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      {isVisible('stats') && (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 text-center">

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
      )}


      {isVisible('memberBreakdown') && (
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
                      <Td className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Avatar src={m.avatar} name={m.display_name || m.name} size={28} />
                          {m.display_name || m.name}
                        </div>
                      </Td>
                      <Td className="text-green-600 font-semibold">{fmt(m.total_deposited)}</Td>
                      <Td className="text-red-600 font-semibold">{fmt(m.total_expenses)}</Td>
                      <Td className={`font-bold ${m.balance > 0 ? 'text-indigo-600' : m.balance < 0 ? 'text-amber-600' : 'text-gray-600'}` }>
                        <div  dir='ltr'>
                          {m.balance < 0 ? '-' : '+'}{fmt(Math.abs(m.balance))}
                          </div>
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
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={m.avatar} name={m.display_name || m.name} size={28} />
                        <p className="truncate font-semibold text-foreground">{m.display_name || m.name}</p>
                      </div>
                      <span className={`text-sm font-bold ${m.balance > 0 ? 'text-indigo-600' : m.balance < 0 ? 'text-amber-600' : 'text-gray-600'}`}  dir='ltr'>
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
      )}


      <div className="grid gap-4 md:grid-cols-2">

        {isVisible('memberNetExpenses') && (
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
        )}


        {isVisible('categoryBreakdown') && (
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
        )}

      </div>


      {isVisible('timeline') && (
      <ExpenseTimeline
        withdrawals={withdrawalsRes?.data}
        loading={isLoadingWithdrawals}
      />
      )}


      {isVisible('settlements') && (
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
      )}

    </div>
  );
}