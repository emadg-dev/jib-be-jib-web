import DatePicker from 'react-multi-date-picker';
import { gregorianToJalali } from '../utils/jalaali';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import persianLocale from 'react-date-object/locales/persian_fa';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import persianCalendar from 'react-date-object/calendars/persian';

// Lightweight helper to convert western digits to Persian digits
// function toPersianDigits(str: string) {
//   if (!str) return '';
//   const map: Record<string,string> = { '0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹' };
//   return str.replace(/[0-9]/g, (d) => map[d]);
// }

interface Props {
  value?: string; // ISO YYYY-MM-DD or full ISO
  onChange: (isoDate: string) => void;
  id?: string;
}

function isoToLocalDate(iso?: string) {
  if (!iso) return new Date();
  const p = iso.slice(0, 10).split('-');
  if (p.length !== 3) return new Date();
  const y = Number(p[0]);
  const m = Number(p[1]);
  const d = Number(p[2]);
  return new Date(y, m - 1, d);
}

export default function JalaliDatePicker({ value, onChange, id }: Props) {
  // Input class taken from existing Input component to match styling
  const inputClass = `flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-sm outline-none transition hover:border-ring/40 focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50`;

  // Render a custom input so we can display Persian digits and RTL
  return (
    <DatePicker
      id={id}
      value={isoToLocalDate(value)}
      onChange={(d: any) => {
        if (!d) return onChange('');
        const dt = d.toDate ? d.toDate() : new Date(d);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${day}`);
      }}
      format="YYYY/MM/DD"
      calendar={persianCalendar as any}
      locale={persianLocale as any}
      portal={true}
      render={(pickerValue: string, openCalendar: () => void) => (
        <div dir="rtl" className="w-full">
          <input
            id={id}
            readOnly
            value={value ? gregorianToJalali(value) : (pickerValue ?? '')}
            onClick={openCalendar}
            className={inputClass}
          />
        </div>
      )}
      placeholder="YYYY/MM/DD"
    />
  );
}
