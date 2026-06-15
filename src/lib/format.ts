import dayjs from 'dayjs';

export const todayISO = (): string => dayjs().format('YYYY-MM-DD');
export const currentMonthKey = (): string => dayjs().format('YYYY-MM');
export const monthKeyOf = (dateISO: string): string => dayjs(dateISO).format('YYYY-MM');
export const monthLabel = (mk: string): string => dayjs(mk + '-01').format('MMMM YYYY');
export const shortMonthLabel = (mk: string): string => dayjs(mk + '-01').format('MMM YY');
export const addMonths = (mk: string, n: number): string =>
  dayjs(mk + '-01').add(n, 'month').format('YYYY-MM');

/** "Today" / "Yesterday" / "12 Jun" / "12 Jun 2025" */
export function dayLabel(dateISO: string): string {
  const d = dayjs(dateISO).startOf('day');
  const today = dayjs().startOf('day');
  const diff = d.diff(today, 'day');
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return d.year() === today.year() ? d.format('D MMM') : d.format('D MMM YYYY');
}

export const prettyDate = (dateISO: string): string => dayjs(dateISO).format('D MMM YYYY');

/** Indian/Bangladeshi digit grouping: 123456 -> "1,23,456" */
export function formatAmount(n: number): string {
  const neg = n < 0;
  const x = Math.round(Math.abs(n)).toString();
  let last3 = x.slice(-3);
  let rest = x.slice(0, -3);
  if (rest) {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    last3 = ',' + last3;
  }
  return (neg ? '-' : '') + rest + last3;
}

export const money = (n: number, symbol = '৳'): string =>
  (n < 0 ? '-' : '') + symbol + formatAmount(Math.abs(n));
/** signed, e.g. "+৳1,000" / "-৳500" */
export const signedMoney = (n: number, type: 'income' | 'expense', symbol = '৳'): string =>
  (type === 'income' ? '+' : '-') + symbol + formatAmount(Math.abs(n));
