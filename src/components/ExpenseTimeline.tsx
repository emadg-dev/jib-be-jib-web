import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Utensils,
  BedDouble,
  Car,
  Camera,
  Tag,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { gregorianToJalali } from '../utils/jalaali';
import type { Withdrawal } from '../api/services';
import { Card, CardContent, CardHeader, CardTitle } from './ui/core';

const CATEGORY_FA: Record<string, string> = {
  Food: 'غذا',
  Accommodation: 'اقامت',
  Transport: 'حمل‌ونقل',
  Activities: 'تفریحات',
  Other: 'سایر',
};

type Style = { wrap: string; badge: string; dot: string; icon: typeof Tag };

const CATEGORY_STYLES: Record<string, Style> = {
  Food: {
    wrap: 'from-emerald-50 to-green-50/60 border-emerald-200/70',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: Utensils,
  },
  Accommodation: {
    wrap: 'from-violet-50 to-purple-50/60 border-violet-200/70',
    badge: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    icon: BedDouble,
  },
  Transport: {
    wrap: 'from-cyan-50 to-sky-50/60 border-cyan-200/70',
    badge: 'bg-cyan-100 text-cyan-700',
    dot: 'bg-cyan-500',
    icon: Car,
  },
  Activities: {
    wrap: 'from-amber-50 to-orange-50/60 border-amber-200/70',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    icon: Camera,
  },
  Other: {
    wrap: 'from-slate-50 to-gray-50/60 border-slate-200/70',
    badge: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-500',
    icon: Tag,
  },
};

const fallback: Style = CATEGORY_STYLES.Other;

const fmt = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toJalaliShort(dateStr: string) {
  const full = gregorianToJalali(dateStr);
  if (!full) return dateStr;
  const parts = full.split('/');
  if (parts.length < 3) return full;
  return `${parts[0].slice(-2)}/${parts[1]}/${parts[2]}`;
}

const PREVIEW = 8;

export default function ExpenseTimeline({
  withdrawals,
  loading,
}: {
  withdrawals?: Withdrawal[];
  loading?: boolean;
}) {
  const { language } = usePreferences();
  const fa = language === 'fa';

  const { groups, hasMore } = useMemo(() => {
    if (!withdrawals?.length) return { groups: [] as [string, Withdrawal[]][], hasMore: false };
    const sorted = withdrawals
      .map((w) => ({ w, d: (w.date || w.created_at || '').slice(0, 10) }))
      .filter((x) => x.d)
      .sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
    const hasMore = sorted.length > PREVIEW;
    const map: Record<string, Withdrawal[]> = {};
    sorted.slice(0, PREVIEW).forEach(({ w, d }) => (map[d] ||= []).push(w));
    return { groups: Object.entries(map), hasMore };
  }, [withdrawals]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
            <Receipt size={18} />
          </span>
          {fa ? 'خط زمانی هزینه‌ها' : 'Expense Timeline'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="h-14 flex-1 animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {fa ? 'هنوز هزینه‌ای ثبت نشده است.' : 'No expenses recorded yet.'}
          </p>
        ) : (
          <div className="relative">
            <div className="absolute bottom-6 start-5 top-6 w-0.5 bg-gradient-to-b from-indigo-300 via-indigo-200 to-transparent" />

            <div className="space-y-6">
              {groups.map(([date, items]) => (
                <div key={date}>
                  <div className="relative mb-3 flex items-center gap-3">
                    <span className="z-10 grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200/70 ring-4 ring-background">
                      <CalendarDays size={18} />
                    </span>
                    <time
                      className="text-sm font-bold tracking-wide text-gray-600"
                      dir="ltr"
                      dateTime={date}
                    >
                      {toJalaliShort(date)}
                    </time>
                  </div>

                  <div className="relative space-y-2.5 ps-12">
                    {items.map((w) => {
                      const style = CATEGORY_STYLES[w.category] || fallback;
                      const Icon = style.icon;
                      const ben = w.beneficiaries || [];
                      return (
                        <div
                          key={w.id}
                          className={`relative rounded-2xl border bg-gradient-to-br p-3.5 shadow-sm transition hover:shadow-md ${style.wrap}`}
                        >
                          <span
                            className={`absolute -start-7 top-6 h-2.5 w-2.5 rounded-full ring-2 ring-background ${style.dot}`}
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`grid h-7 w-7 place-items-center rounded-lg ${style.badge}`}
                                >
                                  <Icon size={14} />
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                  {fa ? CATEGORY_FA[w.category] || w.category : w.category}
                                </span>
                              </div>
                              <p className="mt-1.5 truncate font-medium text-gray-900">
                                {w.description || (fa ? 'بدون توضیح' : 'No description')}
                              </p>
                              {ben.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {ben.slice(0, 4).map((b) => {
                                    const name = b.member_display_name || b.member_name || '?';
                                    return (
                                      <span
                                        key={b.member_id}
                                        className="inline-flex items-center gap-1 rounded-full bg-white/70 py-0.5 pe-2 ps-1 text-[11px] text-gray-600"
                                      >
                                        <span className="grid h-4 w-4 place-items-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">
                                          {name.charAt(0)}
                                        </span>
                                        {name}
                                      </span>
                                    );
                                  })}
                                  {ben.length > 4 && (
                                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-gray-500">
                                      +{ben.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 text-end">
                              <div className="text-base font-bold text-red-600" dir="ltr">
                                {fmt(w.amount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-5 ps-12">
                <Link
                  to="/withdrawals"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {fa ? 'مشاهده همه هزینه‌ها' : 'View all expenses'}
                  <ArrowRight size={16} className={fa ? 'rotate-180' : ''} />
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
