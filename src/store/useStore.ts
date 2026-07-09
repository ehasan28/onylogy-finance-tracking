import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { GroupColors } from '@/constants/theme';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, SEED_ICONS } from '@/data/seed';
import { id } from '@/lib/id';
import type { Category, Settings, Target, ThemePref, Transaction, TxType } from '@/types';

type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

interface FinanceState {
  hydrated: boolean;
  tabBarHeight: number;
  transactions: Transaction[];
  categories: Category[];
  targets: Target[];
  paymentMethods: string[];
  settings: Settings;

  setHydrated: () => void;
  setTabBarHeight: (h: number) => void;
  addTransaction: (t: NewTransaction) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  setTarget: (month: string, patch: Partial<Omit<Target, 'month'>>) => void;
  addPaymentMethod: (name: string) => void;
  removePaymentMethod: (name: string) => void;
  setCurrencySymbol: (symbol: string) => void;
  setDefaultType: (type: TxType) => void;
  setTheme: (theme: ThemePref) => void;
  setVoiceAutoSave: (v: boolean) => void;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  currencySymbol: '৳',
  defaultType: 'expense',
  theme: 'light',
  voiceAutoSave: false,
};

export const useStore = create<FinanceState>()(
  persist(
    (set) => ({
      hydrated: false,
      tabBarHeight: 0,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      targets: [],
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      settings: DEFAULT_SETTINGS,

      setHydrated: () => set({ hydrated: true }),
      setTabBarHeight: (h) => set({ tabBarHeight: h }),

      addTransaction: (t) => {
        const tx: Transaction = { ...t, id: id(), createdAt: Date.now() };
        set((s) => ({
          transactions: [tx, ...s.transactions],
          settings: t.paymentMethod
            ? { ...s.settings, lastPaymentMethod: t.paymentMethod }
            : s.settings,
        }));
        return tx;
      },
      updateTransaction: (txId, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === txId ? { ...t, ...patch } : t)),
        })),
      deleteTransaction: (txId) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== txId) })),

      addCategory: (c) => {
        const cat: Category = { ...c, id: id() };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },
      updateCategory: (catId, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)),
        })),
      deleteCategory: (catId) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== catId) })),

      setTarget: (month, patch) =>
        set((s) => {
          const exists = s.targets.some((t) => t.month === month);
          if (exists) {
            return {
              targets: s.targets.map((t) => (t.month === month ? { ...t, ...patch } : t)),
            };
          }
          return { targets: [...s.targets, { month, incomeTarget: 0, ...patch }] };
        }),

      addPaymentMethod: (name) =>
        set((s) =>
          !name.trim() || s.paymentMethods.includes(name)
            ? s
            : { paymentMethods: [...s.paymentMethods, name] }
        ),
      removePaymentMethod: (name) =>
        set((s) => ({ paymentMethods: s.paymentMethods.filter((p) => p !== name) })),

      setCurrencySymbol: (symbol) =>
        set((s) => ({ settings: { ...s.settings, currencySymbol: symbol || '৳' } })),
      setDefaultType: (type) =>
        set((s) => ({ settings: { ...s.settings, defaultType: type } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setVoiceAutoSave: (v) => set((s) => ({ settings: { ...s.settings, voiceAutoSave: v } })),

      resetAll: () =>
        set({
          transactions: [],
          targets: [],
          categories: DEFAULT_CATEGORIES,
          paymentMethods: DEFAULT_PAYMENT_METHODS,
          settings: DEFAULT_SETTINGS,
        }),
    }),
    {
      name: 'onylogy-finance-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted: any) => {
        if (persisted?.categories) {
          // v1: emoji icons → Ionicons + refreshed group colors
          persisted.categories = persisted.categories.map((c: Category) =>
            SEED_ICONS[c.id] ? { ...c, icon: SEED_ICONS[c.id], color: GroupColors[c.group] ?? c.color } : c
          );
          // v2: drop the Farming group entirely (no longer tracked in this app)
          persisted.categories = persisted.categories.filter((c: Category) => c.group !== 'Farming');
          // reassign any transactions that pointed at a now-removed category
          if (Array.isArray(persisted.transactions)) {
            const validIds = new Set<string>(persisted.categories.map((c: Category) => c.id));
            persisted.transactions = persisted.transactions.map((t: Transaction) =>
              validIds.has(t.categoryId) ? t : { ...t, categoryId: t.type === 'income' ? 'inc_misc' : 'exp_other' }
            );
          }
        }
        return persisted;
      },
      partialize: (s) => ({
        transactions: s.transactions,
        categories: s.categories,
        targets: s.targets,
        paymentMethods: s.paymentMethods,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
