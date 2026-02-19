# DailyDo

A minimal, clean daily task tracker built with React Native (Expo).

## Features

- **Per-day weekly templates** — Monday through Sunday each have their own reusable checklist
- **Daily rollover** — Incomplete items carry forward to the next day automatically (daily reset at midnight)
- **Weekly reset** — Fresh template each week; Sunday night rolls into a new Monday
- **Projects with 3-level hierarchy** — Project → Task → Subtask → Sub-subtask
- **Assign to daily schedule** — Any task can be pinned to specific days of the week
- **Stats** — 14-day completion rates, streaks, and per-day breakdowns (accessible from Today screen)
- **Light & dark mode** — Follows system appearance or set manually in Settings
- **Notifications** — Daily reminder at your chosen time, plus per-item timed reminders
- **Cloud sync ready** — Firebase/Firestore scaffold included (see `firebase.config.example.ts`)

## Getting Started

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go on your iPhone.

## Cloud Sync (optional)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Copy `firebase.config.example.ts` → `firebase.config.ts`
3. Paste your project config
4. Uncomment the Firebase imports in `src/services/firebase.ts`

## Project Structure

```
src/
  types/        – TypeScript interfaces
  theme/        – Colors, spacing, radius tokens
  hooks/        – useTheme
  store/        – Zustand state (persisted via AsyncStorage)
  utils/        – Date helpers
  services/     – Notifications, Firebase
  navigation/   – React Navigation stack + tabs
  screens/      – Today, Templates, TemplateEdit, Projects, ProjectDetail, Stats, Settings
  components/   – CheckItem, ProgressBar, EmptyState
```
