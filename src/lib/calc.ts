import type { Category, Transaction, TxType } from '@/types';
import { monthKeyOf } from './format';

export const catMap = (cats: Category[]): Record<string, Category> =>
  Object.fromEntries(cats.map((c) => [c.id, c]));

export const byMonth = (txs: Transaction[], mk: string): Transaction[] =>
  txs.filter((t) => monthKeyOf(t.date) === mk);

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export function totals(txs: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

/** Sum amounts by category group, optionally filtered to a type. */
export function groupTotals(
  txs: Transaction[],
  cats: Category[],
  type?: TxType
): Record<string, number> {
  const m = catMap(cats);
  const out: Record<string, number> = {};
  for (const t of txs) {
    if (type && t.type !== type) continue;
    const g = m[t.categoryId]?.group ?? 'Other';
    out[g] = (out[g] ?? 0) + t.amount;
  }
  return out;
}

export interface CategorySlice {
  cat: Category;
  amount: number;
}

/** Per-category totals (descending), optionally filtered to a type. */
export function categoryTotals(
  txs: Transaction[],
  cats: Category[],
  type?: TxType
): CategorySlice[] {
  const m = catMap(cats);
  const out: Record<string, CategorySlice> = {};
  for (const t of txs) {
    if (type && t.type !== type) continue;
    const cat = m[t.categoryId];
    if (!cat) continue;
    (out[cat.id] ??= { cat, amount: 0 }).amount += t.amount;
  }
  return Object.values(out).sort((a, b) => b.amount - a.amount);
}

export interface FarmingPL {
  income: number;
  expense: number;
  profit: number;
}

/** Farming income − farming expense, optionally for a single month. */
export function farmingPL(
  txs: Transaction[],
  cats: Category[],
  mk?: string
): FarmingPL {
  const m = catMap(cats);
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    const c = m[t.categoryId];
    if (!c || c.group !== 'Farming') continue;
    if (mk && monthKeyOf(t.date) !== mk) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, profit: income - expense };
}
