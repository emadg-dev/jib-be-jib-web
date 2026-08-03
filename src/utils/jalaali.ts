// Lightweight Gregorian <-> Jalali (Shamsi) conversion
// Adapted from algorithms used in jalaali-js (small, permissive)

export function gregorianToJalali(dateStr: string) {
  if (!dateStr) return '';
  // Accept full ISO or YYYY-MM-DD
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // try parse YYYY-MM-DD
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const gy = parseInt(parts[0], 10);
    const gm = parseInt(parts[1], 10);
    const gd = parseInt(parts[2], 10);
    const j = toJalaali(gy, gm, gd);
    return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
  }
  return toJalaaliStr(d);
}

export function jalaliToGregorianStr(jalaliStr: string) {
  // expects YYYY-MM-DD or YYYY/MM/DD
  const parts = jalaliStr.replace(/\//g, '-').split('-');
  if (parts.length < 3) return '';
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

function toJalaaliStr(d: Date) {
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  const j = toJalaali(gy, gm, gd);
  return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
}

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

// -- Algorithm functions (port from jalaali-js) --------------------------
function div(a: number, b: number) { return Math.floor(a / b); }

function toJalaali(gy: number, gm: number, gd: number) {
  const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
  let jy: number;
  let jm: number;
  let jd: number;
  let gy2 = (gm > 2) ? gy + 1 : gy;
  let days = 355666 + (365 * gy) + div((gy2 + 3), 4) - div((gy2 + 99), 100) + div((gy2 + 399), 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * div(days, 12053));
  days = days % 12053;
  jy += 4 * div(days, 1461);
  days = days % 1461;
  if (days > 365) {
    jy += div((days - 1), 365);
    days = (days - 1) % 365;
  }
  const jm_jd = (days < 186) ? [1 + div(days, 31), 1 + (days % 31)] : [7 + div((days - 186), 30), 1 + ((days - 186) % 30)];
  jm = jm_jd[0];
  jd = jm_jd[1];
  return { jy, jm, jd } as { jy: number; jm: number; jd: number };
}

// Convert Jalali to Gregorian
function toGregorian(jy: number, jm: number, jd: number) {
  // const jalaliEpoch = 1948320.5;
  // Use algorithm from jalaali-js (integer math)
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  // let jm2: number;
  let jump = 0;
  for (let i = 1; i < breaks.length; i++) {
    const jmBreak = breaks[i];
    jump = jmBreak - jp;
    if (jy < jmBreak) break;
    leapJ = leapJ + div(jump, 33) * 8 + div((jump % 33), 4);
    jp = jmBreak;
  }
  const n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(((n % 33) + 3), 4);
  if ((jump % 33) === 4 && (jump - n) === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  const jDayNo = (jm <= 7) ? ((jm - 1) * 31) + jd - 1 : ((jm - 7) * 30) + jd + 185;
  // const gDayNo = march + jDayNo;

  // const gd = gDayNo;
  // Now convert to Gregorian date
  // Create a Date for March 1st of gy
  const gDate = new Date(gy, 2, march); // months 0-based
  gDate.setDate(gDate.getDate() + jDayNo);
  return { gy: gDate.getFullYear(), gm: gDate.getMonth() + 1, gd: gDate.getDate() };
}

// Breaks array used by algorithm
const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

export { toJalaali as toJalali, toGregorian as toGregorian };