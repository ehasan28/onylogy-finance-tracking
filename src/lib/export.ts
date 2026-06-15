import { Platform } from 'react-native';

import type { Category, Transaction } from '@/types';
import { catMap } from './calc';
import { todayISO } from './format';

function esc(v: string): string {
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export function buildCSV(transactions: Transaction[], categories: Category[]): string {
  const m = catMap(categories);
  const header = ['Date', 'Type', 'Category', 'Group', 'Amount', 'Payment Method', 'Note'];
  const rows = [...transactions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt))
    .map((t) => {
      const c = m[t.categoryId];
      return [t.date, t.type, c?.name ?? '', c?.group ?? '', String(t.amount), t.paymentMethod ?? '', t.note ?? '']
        .map(esc)
        .join(',');
    });
  return [header.join(','), ...rows].join('\n');
}

/** Export transactions as a CSV file (download on web, share sheet on native). */
export async function exportCSV(transactions: Transaction[], categories: Category[]): Promise<void> {
  const csv = buildCSV(transactions, categories);
  const filename = `onylogy-finance-${todayISO()}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const FS: any = await import('expo-file-system/legacy');
    const Sharing: any = await import('expo-sharing');
    const dir = FS.cacheDirectory ?? FS.documentDirectory;
    const uri = dir + filename;
    await FS.writeAsStringAsync(uri, csv, { encoding: 'utf8' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export transactions' });
      return;
    }
  } catch {
    // fall through to text share
  }
  const { Share } = await import('react-native');
  await Share.share({ message: csv });
}
