import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { requestPermissions, scheduleDailyReminder } from '../services/notifications';

const REMINDER_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, spacing, radius, isDark } = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const handleTheme = (t: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: t });
  };

  const handleNotifToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Allow notifications in Settings to enable reminders.'
        );
        return;
      }
    }
    updateSettings({ notificationsEnabled: value });
    await scheduleDailyReminder(settings.dailyReminderTime, value);
  };

  const handleTimeSelect = async (time: string) => {
    updateSettings({ dailyReminderTime: time });
    if (settings.notificationsEnabled) {
      await scheduleDailyReminder(time, true);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View
        style={[
          styles.navHeader,
          {
            borderBottomColor: colors.separator,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.accent }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ── */}
        <SettingSection label="APPEARANCE" colors={colors} />
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        >
          {(['system', 'light', 'dark'] as const).map((t, idx, arr) => (
            <TouchableOpacity
              key={t}
              onPress={() => handleTheme(t)}
              style={[
                styles.row,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomWidth: idx < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.separator,
                },
              ]}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t === 'system' ? 'System default' : t === 'light' ? 'Light' : 'Dark'}
              </Text>
              {settings.theme === t && (
                <Text style={{ color: colors.accent, fontSize: 16 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Notifications ── */}
        <SettingSection label="NOTIFICATIONS" colors={colors} />
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.row,
              {
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 4,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.separator,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              Daily reminder
            </Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          {settings.notificationsEnabled && (
            <View
              style={[
                styles.row,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 4,
                  flexWrap: 'wrap',
                  gap: 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.rowLabel,
                  { color: colors.text, width: '100%', marginBottom: 4 },
                ]}
              >
                Reminder time
              </Text>
              {REMINDER_TIMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleTimeSelect(t)}
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor:
                        settings.dailyReminderTime === t
                          ? colors.accent
                          : colors.surfaceElevated,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor:
                        settings.dailyReminderTime === t
                          ? colors.accent
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      {
                        color:
                          settings.dailyReminderTime === t
                            ? '#fff'
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── About ── */}
        <SettingSection label="ABOUT" colors={colors} />
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.row,
              {
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
              DailyDo
            </Text>
            <Text style={[styles.rowValue, { color: colors.textTertiary }]}>
              v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingSection: React.FC<{
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ label, colors }) => (
  <Text
    style={[
      styles.sectionLabel,
      { color: colors.textTertiary, marginBottom: 6, marginTop: 20 },
    ]}
  >
    {label}
  </Text>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { fontSize: 17, width: 60 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  group: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 15 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timeChipText: { fontSize: 14, fontWeight: '500' },
});

export default SettingsScreen;
