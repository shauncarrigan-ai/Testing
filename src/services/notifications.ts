import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TemplateItem } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/** Schedule the recurring daily reminder (e.g. "08:00"). Cancels previous. */
export const scheduleDailyReminder = async (
  timeStr: string,
  enabled: boolean
): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DailyDo',
      body: "Your daily checklist is ready. Let's go!",
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
};

/** Schedule per-item reminders for today's template items that have a time. */
export const scheduleItemReminders = async (
  items: TemplateItem[]
): Promise<void> => {
  const now = new Date();
  for (const item of items) {
    if (!item.time) continue;
    const [h, m] = item.time.split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);
    if (trigger <= now) continue; // already passed today

    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: 'Scheduled task reminder',
        sound: true,
      },
      trigger: { date: trigger },
    });
  }
};

/** Cancel all scheduled notifications. */
export const cancelAllReminders = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
