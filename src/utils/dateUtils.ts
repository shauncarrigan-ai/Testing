import { DayOfWeek } from '../types';

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const getTodayString = (): string => formatDate(new Date());

export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse "YYYY-MM-DD" safely as local midnight */
export const parseDate = (dateStr: string): Date =>
  new Date(`${dateStr}T00:00:00`);

export const addDays = (dateStr: string, days: number): string => {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

export const getDayOfWeek = (dateStr: string): DayOfWeek => {
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[parseDate(dateStr).getDay()];
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export const getDayLabel = (day: DayOfWeek): string => DAY_LABELS[day];

export const getShortDayLabel = (day: DayOfWeek): string =>
  DAY_LABELS[day].substring(0, 3);

export const formatDisplayDate = (dateStr: string): string => {
  const today = getTodayString();
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, -1)) return 'Yesterday';
  if (dateStr === addDays(today, 1)) return 'Tomorrow';
  return parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

export const formatLongDate = (dateStr: string): string =>
  parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

/** Ordered week starting Monday for template display */
export const WEEK_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
