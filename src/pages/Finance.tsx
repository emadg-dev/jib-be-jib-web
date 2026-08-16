import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Banknote } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import Deposits from './Deposits';
import Withdrawals from './Withdrawals';
import Settlements from './Settlements';

type FinanceTab = 'deposits' | 'expenses' | 'settlements';

const TABS: { key: FinanceTab; en: string; fa: string; icon: typeof ArrowDownToLine }[] = [
  { key: 'deposits', en: 'Deposits', fa: 'واریزها', icon: ArrowDownToLine },
  { key: 'expenses', en: 'Expenses', fa: 'هزینه‌ها', icon: ArrowUpFromLine },
  { key: 'settlements', en: 'Settlements', fa: 'تسویه', icon: Banknote },
];

export default function Finance() {
  const { language } = usePreferences();
  const fa = language === 'fa';
  const [tab, setTab] = useState<FinanceTab>('deposits');

  return (
    <div dir={fa ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="flex gap-1 rounded-2xl border border-border bg-card/50 p-1">
        {TABS.map(({ key, en, fa: faLabel, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === key
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            {fa ? faLabel : en}
          </button>
        ))}
      </div>

      {tab === 'deposits' && <Deposits />}
      {tab === 'expenses' && <Withdrawals />}
      {tab === 'settlements' && <Settlements />}
    </div>
  );
}
