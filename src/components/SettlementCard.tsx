import { Card, CardContent, CardHeader, CardTitle } from './ui/core';
import { DollarSign, ArrowRight, Send } from 'lucide-react';
import type { Settlement } from '../api/services';

const GRADIENTS = [
  'from-indigo-50 to-blue-50 border-indigo-200/60',
  'from-emerald-50 to-teal-50 border-emerald-200/60',
  'from-violet-50 to-purple-50 border-violet-200/60',
  'from-amber-50 to-orange-50 border-amber-200/60',
  'from-rose-50 to-pink-50 border-rose-200/60',
  'from-cyan-50 to-sky-50 border-cyan-200/60',
];

const TEXT_COLORS = ['text-indigo-700', 'text-emerald-700', 'text-violet-700', 'text-amber-700', 'text-rose-700', 'text-cyan-700'];
const ARROW_COLORS = ['text-indigo-500', 'text-emerald-500', 'text-violet-500', 'text-amber-500', 'text-rose-500', 'text-cyan-500'];

type Props = { settlements: Settlement[]; fa: boolean; fmt: (v: number) => string; tgEnabled?: boolean; onSendTelegram?: () => void; isSending?: boolean };

export default function SettlementCard({ settlements, fa, fmt, tgEnabled, onSendTelegram, isSending }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            {fa ? 'پیشنهاد تسویه حساب' : 'Suggested Settlements'}
          </CardTitle>
          {tgEnabled && onSendTelegram && (
            <button
              onClick={onSendTelegram}
              disabled={isSending}
              className="rounded-lg p-2 text-[#229ED9] transition hover:bg-[#229ED9]/10 disabled:opacity-50"
              aria-label={fa ? 'ارسال به تلگرام' : 'Send to Telegram'}
              title={fa ? 'ارسال تسویه حساب به تلگرام' : 'Send settlements to Telegram'}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            {fa ? 'همه حساب‌ها صاف شده! نیازی به انتقال پول نیست.' : 'All balances are completely settled up! No transfers required.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settlements.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-xl border shadow-sm bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-gray-900 truncate">{s.fromName}</span>
                  <ArrowRight className={`w-4 h-4 shrink-0 ${ARROW_COLORS[i % ARROW_COLORS.length]} ${fa ? 'rotate-180' : ''}`} />
                  <span className="font-semibold text-gray-900 truncate">{s.toName}</span>
                </div>
                <span className={`text-base font-bold shrink-0 ms-3 ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>
                  {fmt(s.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
