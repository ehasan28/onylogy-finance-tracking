export type TxType = 'income' | 'expense';

export type ThemePref = 'light' | 'dark' | 'system';

export interface Category {
  id: string;
  name: string;
  type: TxType;
  /** e.g. "Farming", "Development", "Personal" — used for source breakdowns & chart colors */
  group: string;
  /** emoji shown in the icon grid */
  icon: string;
  /** hex color used in charts */
  color: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  /** positive amount in BDT */
  amount: number;
  categoryId: string;
  /** optional — Cash / bKash / Nagad / Rocket / Bank Transfer / Card */
  paymentMethod?: string;
  /** ISO date, "YYYY-MM-DD" */
  date: string;
  note?: string;
  createdAt: number;
}

export interface Target {
  /** "YYYY-MM" */
  month: string;
  incomeTarget: number;
  expenseLimit?: number;
}

export interface Settings {
  currencySymbol: string;
  defaultType: TxType;
  lastPaymentMethod?: string;
  theme?: ThemePref;
  /** Voice quick-add: when true, skip the review screen and save immediately. */
  voiceAutoSave?: boolean;
}
