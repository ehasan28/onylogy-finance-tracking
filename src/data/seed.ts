import type { Category } from '@/types';
import { GroupColors } from '@/constants/theme';

const g = (group: string) => GroupColors[group] ?? GroupColors.Other;

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Card',
];

/** Category icons are Ionicons names (iOS-style line icons). */
export const DEFAULT_CATEGORIES: Category[] = [
  // ---------- INCOME ----------
  { id: 'inc_fiverr', name: 'Fiverr', type: 'income', group: 'Development', icon: 'briefcase-outline', color: g('Development') },
  { id: 'inc_upwork', name: 'Upwork', type: 'income', group: 'Development', icon: 'laptop-outline', color: g('Development') },
  { id: 'inc_clients', name: 'Direct clients', type: 'income', group: 'Development', icon: 'people-outline', color: g('Development') },
  { id: 'inc_plugin', name: 'Plugin/Extension', type: 'income', group: 'Development', icon: 'extension-puzzle-outline', color: g('Development') },

  { id: 'inc_parents', name: 'From parents', type: 'income', group: 'Family Support', icon: 'home-outline', color: g('Family Support') },
  { id: 'inc_relatives', name: 'From relatives', type: 'income', group: 'Family Support', icon: 'people-circle-outline', color: g('Family Support') },

  { id: 'inc_gift', name: 'Gifts', type: 'income', group: 'Other', icon: 'gift-outline', color: g('Other') },
  { id: 'inc_misc', name: 'Misc', type: 'income', group: 'Other', icon: 'ellipsis-horizontal', color: g('Other') },

  // ---------- EXPENSE ----------
  { id: 'exp_food', name: 'Food', type: 'expense', group: 'Personal', icon: 'restaurant-outline', color: g('Personal') },
  { id: 'exp_transport', name: 'Transport', type: 'expense', group: 'Personal', icon: 'bus-outline', color: g('Personal') },
  { id: 'exp_mobile', name: 'Mobile/Internet', type: 'expense', group: 'Personal', icon: 'wifi-outline', color: g('Personal') },
  { id: 'exp_clothing', name: 'Clothing', type: 'expense', group: 'Personal', icon: 'shirt-outline', color: g('Personal') },
  { id: 'exp_health', name: 'Health', type: 'expense', group: 'Personal', icon: 'medkit-outline', color: g('Personal') },
  { id: 'exp_education', name: 'Education', type: 'expense', group: 'Personal', icon: 'school-outline', color: g('Personal') },

  { id: 'exp_hosting', name: 'Hosting/Domains', type: 'expense', group: 'Business', icon: 'globe-outline', color: g('Business') },
  { id: 'exp_software', name: 'Software/Subscriptions', type: 'expense', group: 'Business', icon: 'apps-outline', color: g('Business') },
  { id: 'exp_tools', name: 'Tools', type: 'expense', group: 'Business', icon: 'build-outline', color: g('Business') },
  { id: 'exp_marketing', name: 'Marketing', type: 'expense', group: 'Business', icon: 'megaphone-outline', color: g('Business') },

  { id: 'exp_donation', name: 'Donation/Sadaqah', type: 'expense', group: 'Giving', icon: 'heart-outline', color: g('Giving') },
  { id: 'exp_zakat', name: 'Zakat', type: 'expense', group: 'Giving', icon: 'moon-outline', color: g('Giving') },

  { id: 'exp_other', name: 'Other', type: 'expense', group: 'Other', icon: 'ellipsis-horizontal', color: g('Other') },
];

/** id -> icon, used to migrate already-stored categories from emoji to Ionicons. */
export const SEED_ICONS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.id, c.icon])
);
