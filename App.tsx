import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/store';
import {
  requestPermissions,
  scheduleDailyReminder,
  scheduleItemReminders,
} from './src/services/notifications';
import {
  getTodayString,
  getDayOfWeek,
} from './src/utils/dateUtils';

export default function App() {
  const settings = useStore((s) => s.settings);
  const weeklyTemplate = useStore((s) => s.weeklyTemplate);

  useEffect(() => {
    const initNotifications = async () => {
      if (!settings.notificationsEnabled) return;
      const granted = await requestPermissions();
      if (!granted) return;

      // Schedule the daily reminder
      await scheduleDailyReminder(
        settings.dailyReminderTime,
        settings.notificationsEnabled
      );

      // Schedule any per-item reminders for today's template
      const today = getTodayString();
      const dow = getDayOfWeek(today);
      const todayItems = weeklyTemplate[dow];
      await scheduleItemReminders(todayItems);
    };

    initNotifications();
  }, [settings.notificationsEnabled, settings.dailyReminderTime]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
