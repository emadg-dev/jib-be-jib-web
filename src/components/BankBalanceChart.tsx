import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/core';
import { Wallet } from 'lucide-react';
import type { Deposit, Withdrawal } from '../api/services';

type Props = {
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  fa: boolean;
  fmt: (v: number) => string;
};

export default function BankBalanceChart({ deposits, withdrawals, fa, fmt }: Props) {
  const chartData = useMemo(() => {
    const events: { date: string; amount: number }[] = [];

    for (const d of deposits) {
      events.push({ date: d.date || d.created_at, amount: d.amount });
    }
    for (const w of withdrawals) {
      const totalShare = w.beneficiaries.reduce((sum, b) => sum + b.share, 0);
      events.push({ date: w.date || w.created_at, amount: -(totalShare || w.amount) });
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    let running = 0;
    return events.map((e) => {
      running += e.amount;
      return { date: e.date, balance: Math.round(running * 100) / 100 };
    });
  }, [deposits, withdrawals]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-600" />
          {fa ? 'موجودی حساب در طول زمان' : 'Bank Balance Over Time'}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData.length > 0 ? (
          <div dir="ltr" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  formatter={(value: number) => [fmt(value), fa ? 'موجودی' : 'Balance']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString(fa ? 'fa-IR' : 'en-US')}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-4 text-center">
            {fa ? 'هنوز تراکنشی ثبت نشده است.' : 'No transactions recorded yet.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
