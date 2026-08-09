import { useState, useEffect } from 'react';
import { toJalali, toGregorian } from '../utils/jalaali';

const MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const MONTHS_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
];

function daysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // 12th month: 29 or 30 depending on leap year
  const g = toGregorian(jy, 12, 1);
  const next = toGregorian(jy, 12, 2);
  return next.gd - g.gd === 1 ? 30 : 29;
}

function todayJalali() {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function isoToJalali(iso?: string) {
  if (!iso) return todayJalali();
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return todayJalali();
  return toJalali(+parts[0], +parts[1], +parts[2]);
}

function jalaliToIso(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

interface Props {
  value?: string;
  onChange: (isoDate: string) => void;
  id?: string;
}

export default function JalaliDatePicker({ value, onChange, id }: Props) {
  const init = isoToJalali(value);
  const [jy, setJy] = useState(init.jy);
  const [jm, setJm] = useState(init.jm);
  const [jd, setJd] = useState(init.jd);

  useEffect(() => {
    const j = isoToJalali(value);
    setJy(j.jy);
    setJm(j.jm);
    setJd(j.jd);
  }, [value]);

  const maxDay = daysInJalaliMonth(jy, jm);
  const clampedJd = Math.min(jd, maxDay);

  const emit = (ny: number, nm: number, nd: number) => {
    const max = daysInJalaliMonth(ny, nm);
    const d = Math.min(nd, max);
    onChange(jalaliToIso(ny, nm, d));
  };

  const inputClass = 'flex h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20';

  // appearance-none removes the native arrow; extra left padding (RTL) reserves
  // room for the custom chevron instead of it hugging the edge
  const selectClass = `${inputClass} cursor-pointer appearance-none pl-8 bg-no-repeat bg-[length:16px] bg-[position:left_0.75rem_center]`;
  const chevronBg = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  };

  const MIN_YEAR = 1400;
  const MAX_YEAR = 1500;
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);
  const yearOptions = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i
  );

  return (
    <div id={id} dir="rtl" className="flex gap-2">
      <select
        value={clampedJd}
        onChange={(e) => {
          const d = +e.target.value;
          setJd(d);
          emit(jy, jm, d);
        }}
        className={`${selectClass} w-20 text-center`}
        style={chevronBg}
      >
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={jm}
        onChange={(e) => {
          const m = +e.target.value;
          setJm(m);
          const max = daysInJalaliMonth(jy, m);
          const d = Math.min(jd, max);
          setJd(d);
          emit(jy, m, d);
        }}
        className={`${selectClass} w-40`}
        style={chevronBg}
      >
        {MONTHS_FA.map((name, i) => (
          <option key={i + 1} value={i + 1}>
            {name} ({MONTHS_EN[i]})
          </option>
        ))}
      </select>

      <select
        value={jy}
        onChange={(e) => {
          const y = +e.target.value;
          setJy(y);
          emit(y, jm, clampedJd);
        }}
        className={`${selectClass} w-28 text-center`}
        style={chevronBg}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}