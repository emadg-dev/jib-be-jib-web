import { useQuery, useMutation} from '@tanstack/react-query';
import { dashboardApi, withdrawalsApi, depositsApi, profileApi, ratingsApi, notificationsApi } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Tr, Th, Td, Button} from '../components/ui/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Users, LayoutGrid, List, SlidersHorizontal, Star, Banknote, Send } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { DashboardSkeleton } from '../components/Skeleton';
import ExpenseTimeline from '../components/ExpenseTimeline';
import Avatar from '../components/Avatar';
import StatCard from '../components/StatCard';
import SettlementCard from '../components/SettlementCard';
import BankBalanceChart from '../components/BankBalanceChart';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SECTION_KEYS = ['stats', 'memberBreakdown', 'memberNetExpenses', 'categoryBreakdown', 'timeline', 'settlements', 'balanceChart', 'ratings'] as const;
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
  const { user, updateUser, selectedTrip, isOwner } = useAuth();
  const { hasPermission } = usePermissions();
  const canSendTelegram = isOwner || hasPermission('notifications.send');
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
    onError: () => { },
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
    balanceChart: { en: 'Bank Balance Over Time', fa: 'موجودی حساب در طول زمان' },
    memberNetExpenses: { en: 'Member Net Expenses', fa: 'هزینه خالص اعضا' },
    categoryBreakdown: { en: 'Expenses by Category', fa: 'هزینه‌ها بر اساس دسته‌بندی' },
    timeline: { en: 'Expense Timeline', fa: 'خط زمانی هزینه‌ها' },
    settlements: { en: 'Suggested Settlements', fa: 'پیشنهاد تسویه حساب' },
    ratings: { en: 'Member Ratings', fa: 'ارزیابی اعضا' },
  };

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    enabled: !!selectedTrip,
  });

  const { data: withdrawalsRes, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: withdrawalsApi.getAll,
    enabled: !!selectedTrip,
  });

  const { data: depositsRes } = useQuery({
    queryKey: ['deposits'],
    queryFn: depositsApi.getAll,
    enabled: !!selectedTrip,
  });

  const { data: ratingsStatusRes } = useQuery({
    queryKey: ['ratings', 'status'],
    queryFn: ratingsApi.getStatus,
    enabled: !!selectedTrip,
  });

  const { data: ratingsResultsRes } = useQuery({
    queryKey: ['ratings', 'results'],
    queryFn: ratingsApi.getResults,
    enabled: !!selectedTrip,
  });

  const { data: tgSettingsRes } = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: notificationsApi.getSettings,
    enabled: !!selectedTrip,
  });

  // const queryClient = useQueryClient();
  const tgEnabled = tgSettingsRes?.data?.telegram_enabled === true;
  const [customMessageOpen, setCustomMessageOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const customMessageRef = useRef<HTMLTextAreaElement>(null);

  const sendMutation = useMutation({
    mutationFn: (msg: string) => notificationsApi.sendCustom({ message: msg }),
    onSuccess: () => {
      setCustomMessageOpen(false);
      setCustomMessage('');
    },
  });

  const sendMembersMutation = useMutation({
    mutationFn: notificationsApi.sendMembers,
  });

  const sendBankStatsMutation = useMutation({
    mutationFn: notificationsApi.sendBankStats,
  });

  const sendSettlementsMutation = useMutation({
    mutationFn: notificationsApi.sendSettlements,
  });

  const sendRatingsMutation = useMutation({
    mutationFn: notificationsApi.sendRatings,
  });

  const isSending = sendMutation.isPending || sendMembersMutation.isPending || sendBankStatsMutation.isPending || sendSettlementsMutation.isPending || sendRatingsMutation.isPending;

  useEffect(() => {
    if (customMessageOpen && customMessageRef.current) {
      customMessageRef.current.focus();
    }
  }, [customMessageOpen]);

  const navigate = useNavigate();

  if (isLoading) return <DashboardSkeleton />;

  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        {fa ? 'دریافت اطلاعات داشبورد با مشکل مواجه شد.' : 'Failed to load dashboard data.'}
      </div>
    );

  const data = res?.data;
  if (!data) return null;

  const deposits = Array.isArray(depositsRes?.data) ? depositsRes.data : [];
  const withdrawals = Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : [];

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

        <div className="flex items-center gap-2">
          {tgEnabled && canSendTelegram && (
            <button
              onClick={() => setCustomMessageOpen(true)}
              disabled={isSending}
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#229ED9] text-white shadow-sm transition hover:bg-[#1a7fb5] disabled:opacity-50"
              aria-label={fa ? 'ارسال پیام به تلگرام' : 'Send to Telegram'}
              title={fa ? 'ارسال پیام دلخواه به تلگرام' : 'Send custom message to Telegram'}
            >
              <Send size={18} />
            </button>
          )}
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
      </div>


      {isVisible('stats') && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 text-center">
           {tgEnabled && canSendTelegram && (
            <div className="col-span-full flex justify-end">
              <button
                onClick={() => sendBankStatsMutation.mutate()}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#229ED9] transition hover:bg-[#229ED9]/10 disabled:opacity-50"
                title={fa ? 'ارسال آمار بانک به تلگرام' : 'Send bank stats to Telegram'}
              >
                <Send size={14} />
                {fa ? 'ارسال به تلگرام' : 'Send to Telegram'}
              </button>
            </div>
          )}
          <StatCard
            title={fa ? 'موجودی حساب' : 'Bank Balance'}
            value={fmt(data.currentBankBalance)}
            icon={<Wallet className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title={fa ? 'کل واریزی‌ها' : 'Total Deposits'}
            value={fmt(data.totalDeposits)}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            valueClassName="text-green-600"
          />
          <StatCard
            title={fa ? 'کل خرج‌ها' : 'Total Withdrawals'}
            value={fmt(data.totalWithdrawals)}
            icon={<TrendingDown className="w-5 h-5 text-red-600" />}
            valueClassName="text-red-600"
          />
          {data.totalSettled <= 0 && (

            <StatCard
            title={fa ? 'اعضای فعال' : 'Active Members'}
            value={String(data.members.length)}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            />
          )}
          {data.totalSettled > 0 && (
            <StatCard
              title={fa ? 'تسویه شده' : 'Settled'}
              value={fmt(data.totalSettled)}
              icon={<Banknote className="w-5 h-5 text-emerald-600" />}
              valueClassName="text-emerald-600"
            />
          )}
         
        </div>
      )}
      

{isVisible('ratings') && (() => {
        const ratingsStatus = ratingsStatusRes?.data || [];
        const ratingsResults = ratingsResultsRes?.data || [];
        const pendingMembers = ratingsStatus.filter((m: any) => !m.submitted);
        const myStatus = ratingsStatus.find((m: any) => m.id === user?.id);
        const hasNotSubmitted = myStatus && !myStatus.submitted;

        return (
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Star size={20} className="text-amber-500" />
                  {fa ? 'ارزیابی اعضا' : 'Member Ratings'}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {tgEnabled && canSendTelegram && (
                    <button
                      onClick={() => sendRatingsMutation.mutate()}
                      disabled={isSending}
                      className="rounded-lg p-2 text-[#229ED9] transition hover:bg-[#229ED9]/10 disabled:opacity-50"
                      aria-label={fa ? 'ارسال به تلگرام' : 'Send to Telegram'}
                      title={fa ? 'ارسال نتایج ارزیابی به تلگرام' : 'Send ratings to Telegram'}
                    >
                      <Send size={16} />
                    </button>
                  )}
                  {hasNotSubmitted && (
                    <Button variant="secondary" onClick={() => navigate('/ratings')}>
                      {fa ? 'ارزیابی کنید' : 'Rate now'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingMembers.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/10">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {fa
                      ? `${pendingMembers.length} عضو هنوز ارزیابی نکرده‌اند`
                      : `${pendingMembers.length} member${pendingMembers.length > 1 ? 's' : ''} haven't rated yet`}
                  </p>
                </div>
              )}

              {ratingsResults.length > 0 ? (
                <div
                  dir="ltr"
                  style={{ height: Math.max(300, ratingsResults.length * 40) }}
                  className={hasNotSubmitted ? 'pointer-events-none select-none blur-md' : ''}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingsResults} layout="vertical" margin={{ left: 4 }}>
                      <XAxis type="number" domain={[0, 15]} />
                      <YAxis
                        type="category"
                        dataKey="display_name"
                        width={120}
                        tick={{ fontSize: 12 }}
                        tickFormatter={hasNotSubmitted ? () => '••••••' : undefined}
                      />
                      <Tooltip
                        formatter={(val: any, name: string) => {
                          const labels: Record<string, { en: string; fa: string }> = {
                            ethics_avg: { en: 'Ethics', fa: 'اخلاق' },
                            participation_avg: { en: 'Participation', fa: 'مشارکت' },
                            flexibility_avg: { en: 'Flexibility', fa: 'انعطاف' },
                          };
                          return [Number(val).toFixed(1), fa ? (labels[name]?.fa || name) : (labels[name]?.en || name)];
                        }}
                      />
                      <Legend
                        formatter={(value: string) => {
                          const labels: Record<string, { en: string; fa: string }> = {
                            ethics_avg: { en: 'Ethics', fa: 'اخلاق' },
                            participation_avg: { en: 'Participation', fa: 'مشارکت' },
                            flexibility_avg: { en: 'Flexibility', fa: 'انعطاف' },
                          };
                          return fa ? (labels[value]?.fa || value) : (labels[value]?.en || value);
                        }}
                      />
                      <Bar dataKey="ethics_avg" stackId="ratings" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="participation_avg" stackId="ratings" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="flexibility_avg" stackId="ratings" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {fa ? 'هنوز ارزیابی ثبت نشده است.' : 'No ratings submitted yet.'}
                </p>
              )}
              {hasNotSubmitted && ratingsResults.length > 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {fa ? 'نمودار پس از ثبت تمام ارزیابی‌ها نمایش داده می‌شود' : 'Chart will be visible after submitting all ratings'}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}



      {isVisible('memberBreakdown') && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {fa ? 'وضعیت حساب اعضا' : 'Member Financial Breakdown'}
              </CardTitle>
              <div className="flex items-center gap-1">
                {tgEnabled && canSendTelegram && (
                  <button
                    onClick={() => sendMembersMutation.mutate()}
                    disabled={isSending}
                    className="rounded-lg p-2 text-[#229ED9] transition hover:bg-[#229ED9]/10 disabled:opacity-50"
                    aria-label={fa ? 'ارسال به تلگرام' : 'Send to Telegram'}
                    title={fa ? 'ارسال جدول اعضا به تلگرام' : 'Send member breakdown to Telegram'}
                  >
                    <Send size={16} />
                  </button>
                )}
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
                    {data.totalSettled > 0 && <Th>{fa ? 'تسویه شده' : 'Settled'}</Th>}
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
                        {data.totalSettled > 0 && <Td className="text-emerald-600 font-semibold">{fmt(m.total_settled)}</Td>}
                        <Td className={`font-bold ${m.balance > 0 ? 'text-indigo-600' : m.balance < 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                          <div dir='ltr'>
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
                        <span className={`text-sm font-bold ${m.balance > 0 ? 'text-indigo-600' : m.balance < 0 ? 'text-amber-600' : 'text-gray-600'}`} dir='ltr'>
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
                        {data.totalSettled > 0 && m.total_settled > 0 && (
                          <span className="text-emerald-600">
                            {fa ? 'تسویه:' : 'Settled:'} {fmt(m.total_settled)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {isVisible('balanceChart') && (
              <BankBalanceChart deposits={deposits} withdrawals={withdrawals} fa={fa} fmt={fmt} />
            )}


      {(() => {
        const chartsVisible = isVisible('memberNetExpenses') || isVisible('categoryBreakdown');
        const chartsBoth = isVisible('memberNetExpenses') && isVisible('categoryBreakdown');
        return chartsVisible && (
          <div className={`grid gap-4 ${chartsBoth ? 'md:grid-cols-2' : ''}`}>
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
                          formatter={(val: any) => [fmt(Number(val)), fa ? 'هزینه خالص' : 'Net Expenses']}
                        />
                        <Bar dataKey="total_expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
                          label={({ name, percent }) =>
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
                          formatter={(val: any) => [fmt(Number(val)), fa ? 'هزینه' : 'Spent']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {(() => {
        const tlVisible = isVisible('timeline');
        const stVisible = isVisible('settlements');
        const both = tlVisible && stVisible;
        return (tlVisible || stVisible) && (
          <div className={`grid gap-4 ${both ? 'lg:grid-cols-2' : ''}`}>
            {tlVisible && (
              <ExpenseTimeline
                withdrawals={withdrawals}
                loading={isLoadingWithdrawals}
              />
            )}
            {stVisible && (
              <SettlementCard
                settlements={data.settlements}
                fa={fa}
                fmt={fmt}
                tgEnabled={tgEnabled}
                isOwner={canSendTelegram}
                onSendTelegram={() => sendSettlementsMutation.mutate()}
                isSending={isSending}
              />
            )}
          </div>
        );
      })()}

      {customMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setCustomMessageOpen(false); setCustomMessage(''); }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {fa ? 'ارسال پیام به تلگرام' : 'Send to Telegram'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {fa ? 'پیام دلخواه خود را بنویسید و به گروه تلگرام ارسال کنید.' : 'Write a custom message to send to the Telegram group.'}
            </p>
            <textarea
              ref={customMessageRef}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#229ED9]/50 resize-none"
              placeholder={fa ? 'پیام خود را اینجا بنویسید...' : 'Type your message here...'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && customMessage.trim()) {
                  sendMutation.mutate(customMessage.trim());
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => { setCustomMessageOpen(false); setCustomMessage(''); }}
              >
                {fa ? 'لغو' : 'Cancel'}
              </Button>
              <Button
                onClick={() => {
                  if (customMessage.trim()) sendMutation.mutate(customMessage.trim());
                }}
                loading={sendMutation.isPending}
                disabled={!customMessage.trim() || sendMutation.isPending}
                className="bg-[#229ED9] hover:bg-[#1a7fb5] text-white"
              >
                <Send size={16} className="me-1.5" />
                {fa ? 'ارسال' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
