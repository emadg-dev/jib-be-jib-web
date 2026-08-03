export function formatAmount(value: string): string {
  const s = value.replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  const hasDot = firstDot !== -1;

  const intRaw = hasDot ? s.slice(0, firstDot) : s;
  const decRaw = hasDot ? s.slice(firstDot + 1).replace(/\./g, '') : '';

  const grouped = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const intPart = intRaw === '' && decRaw !== '' ? '0' : grouped;

  return hasDot ? `${intPart}.${decRaw}` : intPart;
}

export function parseMoney(
  value: string | number | undefined | null
): number {
  if (value == null) return NaN;
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/,/g, ''));
}