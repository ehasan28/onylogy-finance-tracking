# 💰 Onylogy Finance Tracking

A fast, offline-first personal income & expense tracker for **iPhone + Android**, built with Expo (React Native).
Tailored for farming + development/freelancing + family-support income, in BDT (৳). Clean, Apple-minimal UI with full light & dark support.

> **Status:** Live as an installable PWA, continuously deployed from this repo via Vercel. All data is stored privately on the device — no account, no server.

## Features
- **Add transaction in seconds** — Income/Expense toggle, fast number keypad, 1-tap categories (recently-used first), optional payment method (Cash/bKash/Nagad/Rocket/Bank/Card), date stepper, note. Save / Save & add another / edit / delete.
- **Home** — monthly balance (animated count-up), income vs expense, animated income-target progress, income-by-source cards, recent transactions.
- **History** — filter by type/group, search, grouped by date with daily totals; tap to edit.
- **Reports** — 6-month net-balance trend, 🌾 **Farming Profit/Loss**, expense breakdown, income by source.
- **Settings** — monthly target & expense limit, manage payment methods & categories, currency symbol, **CSV export**, reset.

## Run it now (free, on your phone)
```bash
npm install
npx expo start        # press w for web, or scan the QR with the Expo Go app
```
Install **Expo Go** (App Store / Play Store) and scan the QR to use it live on your phone while developing.

## Build a free Android app (APK)
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview   # produces an installable .apk
```
Download the APK, copy to your Android phone, enable "install unknown apps", install. **$0.**

## Deploy (free, automatic via Vercel)
This repo is wired for **continuous deployment** — every push to `main` triggers a Vercel build and ships it live (config in [`vercel.json`](vercel.json)):
```bash
git push        # Vercel runs `expo export -p web` and deploys dist/
```
Then open the deployed URL in **Safari → Share → Add to Home Screen** for a full-screen, offline-capable iPhone app. A service worker (`public/sw.js`) caches assets for offline use. **$0.**

## Publish to stores (optional, later)
- **Google Play:** `eas build -p android --profile production` → upload AAB. **$25 one-time.**
- **Apple App Store:** `eas build -p ios && eas submit`. **$99/year** (also removes PWA limitations).

## Sample data
The app currently contains demo transactions for June/May 2026. To start clean: **Settings → Reset all data**.

## Tech notes (SDK 56)
Built on the bleeding-edge **Expo SDK 56** (React 19.2, RN 0.85, Reanimated 4). For reliability on this version, a few plan libraries were swapped for built-ins with identical results:
- **Styling:** StyleSheet + theme tokens (`src/constants/theme.ts`) instead of NativeWind.
- **Animation:** Reanimated 4 directly (count-up, progress bar, list transitions) instead of Moti.
- **Charts:** lightweight animated Views instead of react-native-gifted-charts (avoids the native linear-gradient dep; works on web/PWA + native).
- **Storage:** Zustand + AsyncStorage (`src/store/useStore.ts`) instead of expo-sqlite, so the same code runs on Android, the iPhone PWA, and web. Small data set, JS aggregation in `src/lib/calc.ts`.

## Project structure
```
src/
  app/                 # expo-router routes
    _layout.tsx        # root Stack (+ /add modal)
    (tabs)/            # Home, History, Reports, Settings + custom tab bar
    add.tsx            # Add / Edit / Delete transaction (modal)
    categories.tsx     # Category manager
  components/          # screen, ui, keypad, animated, transaction-row, bottom-tab-bar
  store/useStore.ts    # Zustand store (persisted to AsyncStorage)
  lib/                 # calc, format, export (CSV), haptics, id
  data/seed.ts         # default categories & payment methods
  constants/theme.ts   # colors, spacing, finance palette
```

## Roadmap (Phase 2+)
Bangla (বাংলা) i18n · app lock (biometric) · recurring transactions · JSON backup/restore · optional Supabase cloud sync · (Android-only, personal) bKash/Nagad SMS parsing.
