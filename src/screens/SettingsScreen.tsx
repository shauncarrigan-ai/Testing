import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { requestPermissions, scheduleDailyReminder } from '../services/notifications';

type Period = 'AM' | 'PM';

// ── Hour Carousel constants ──────────────────────────────────────────────────
const ITEM_H = 36;
const VISIBLE_ITEMS = 3;
const CAROUSEL_H = ITEM_H * VISIBLE_ITEMS; // 108
const CAROUSEL_PAD = CAROUSEL_H / 2 - ITEM_H / 2; // 36

interface HourCarouselProps {
  hours: number[];
  selectedHour: number;
  onSelect: (h: number) => void;
  clockFormat: '12' | '24';
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
}

const HourCarousel: React.FC<HourCarouselProps> = ({
  hours,
  selectedHour,
  onSelect,
  clockFormat,
  colors,
  radius,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIdx = hours.indexOf(selectedHour);

  useEffect(() => {
    if (selectedIdx >= 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: selectedIdx * ITEM_H, animated: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedIdx]);

  const handleScrollEnd = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(Math.round(y / ITEM_H), hours.length - 1));
    onSelect(hours[idx]);
  };

  return (
    <View style={{ height: CAROUSEL_H, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={[
          styles.carouselHighlight,
          {
            top: CAROUSEL_PAD,
            backgroundColor: colors.accentLight,
            borderColor: colors.accent,
            borderRadius: radius.sm,
          },
        ]}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: CAROUSEL_PAD }}
      >
        {hours.map((h, idx) => {
          const isSelected = h === selectedHour;
          return (
            <TouchableOpacity
              key={h}
              onPress={() => {
                onSelect(h);
                scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
              }}
              style={styles.carouselItem}
            >
              <Text
                style={{
                  fontSize: isSelected ? 18 : 13,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected ? colors.accent : colors.textSecondary,
                  opacity: isSelected ? 1 : 0.55,
                }}
              >
                {clockFormat === '24' ? h.toString().padStart(2, '0') : h}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const SettingsScreen: React.FC = () => {
  const { colors, spacing, radius, isDark } = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const clockFormat = settings.clockFormat ?? '12';
  const storedHour = parseInt(settings.dailyReminderTime.split(':')[0], 10);
  const [period, setPeriod] = useState<Period>(storedHour < 12 ? 'AM' : 'PM');
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  const getDisplayHour = (hour24: number): number => {
    if (clockFormat === '24') return hour24;
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
  };

  const selectedDisplayHour = getDisplayHour(storedHour);

  const hours12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const hours24 = Array.from({ length: 24 }, (_, i) => i);
  const hoursToShow = clockFormat === '12' ? hours12 : hours24;

  const handleTheme = (t: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: t });
  };

  const handleClockFormat = (fmt: '12' | '24') => {
    updateSettings({ clockFormat: fmt });
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

  const handleHourSelect = async (displayHour: number) => {
    let hour24: number;
    if (clockFormat === '24') {
      hour24 = displayHour;
    } else {
      if (period === 'AM') {
        hour24 = displayHour === 12 ? 0 : displayHour;
      } else {
        hour24 = displayHour === 12 ? 12 : displayHour + 12;
      }
    }
    const timeStr = `${hour24.toString().padStart(2, '0')}:00`;
    updateSettings({ dailyReminderTime: timeStr });
    if (settings.notificationsEnabled) {
      await scheduleDailyReminder(timeStr, true);
    }
  };

  const handlePeriodChange = async (newPeriod: Period) => {
    setPeriod(newPeriod);
    let hour24: number;
    if (newPeriod === 'AM') {
      hour24 = selectedDisplayHour === 12 ? 0 : selectedDisplayHour;
    } else {
      hour24 = selectedDisplayHour === 12 ? 12 : selectedDisplayHour + 12;
    }
    const timeStr = `${hour24.toString().padStart(2, '0')}:00`;
    updateSettings({ dailyReminderTime: timeStr });
    if (settings.notificationsEnabled) {
      await scheduleDailyReminder(timeStr, true);
    }
  };

  const formatSelectedTime = (): string => {
    const h = storedHour;
    if (clockFormat === '24') {
      return `${h.toString().padStart(2, '0')}:00`;
    }
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const p = h < 12 ? 'AM' : 'PM';
    return `${displayH}:00 ${p}`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.separator,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
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
          {(['system', 'light', 'dark'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => handleTheme(t)}
              style={[
                styles.row,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomWidth: StyleSheet.hairlineWidth,
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
          {/* Daily reminder toggle */}
          <View
            style={[
              styles.row,
              {
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 4,
                borderBottomWidth: settings.notificationsEnabled ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: colors.separator,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Daily reminder</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          {/* Tappable "Set time" row — visible only when notifications enabled */}
          {settings.notificationsEnabled && (
            <TouchableOpacity
              onPress={() => setTimeModalVisible(true)}
              style={[
                styles.row,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 4,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>Set time</Text>
              <View style={styles.timeChevronRow}>
                <Text style={[styles.selectedTimeText, { color: colors.accent }]}>
                  {formatSelectedTime()}
                </Text>
                <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
              </View>
            </TouchableOpacity>
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
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>DailyDo</Text>
            <Text style={[styles.rowValue, { color: colors.textTertiary }]}>Alpha 1</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Time Picker Modal ── */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set Reminder Time</Text>

            {/* Clock format */}
            <View style={[styles.row, { marginBottom: spacing.md }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Clock format</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  onPress={() => handleClockFormat('12')}
                  style={[
                    styles.segmentBtn,
                    styles.segmentBtnLeft,
                    {
                      backgroundColor: clockFormat === '12' ? colors.accent : colors.surfaceElevated,
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Text style={[styles.segmentBtnText, { color: clockFormat === '12' ? '#fff' : colors.accent }]}>
                    12hr
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleClockFormat('24')}
                  style={[
                    styles.segmentBtn,
                    styles.segmentBtnRight,
                    {
                      backgroundColor: clockFormat === '24' ? colors.accent : colors.surfaceElevated,
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Text style={[styles.segmentBtnText, { color: clockFormat === '24' ? '#fff' : colors.accent }]}>
                    24hr
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* AM / PM selector (12hr only) */}
            {clockFormat === '12' && (
              <View style={[styles.segmentRowFull, { marginBottom: spacing.md }]}>
                <TouchableOpacity
                  onPress={() => handlePeriodChange('AM')}
                  style={[
                    styles.periodBtn,
                    {
                      backgroundColor: period === 'AM' ? colors.accentLight : colors.surfaceElevated,
                      borderColor: period === 'AM' ? colors.accent : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text style={[styles.periodBtnText, { color: period === 'AM' ? colors.accent : colors.textSecondary }]}>
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePeriodChange('PM')}
                  style={[
                    styles.periodBtn,
                    {
                      backgroundColor: period === 'PM' ? colors.accentLight : colors.surfaceElevated,
                      borderColor: period === 'PM' ? colors.accent : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text style={[styles.periodBtnText, { color: period === 'PM' ? colors.accent : colors.textSecondary }]}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Hour carousel */}
            <HourCarousel
              hours={hoursToShow}
              selectedHour={selectedDisplayHour}
              onSelect={handleHourSelect}
              clockFormat={clockFormat}
              colors={colors}
              radius={radius}
            />

            {/* Selected time label */}
            <Text style={[styles.currentTimeLabel, { color: colors.accent, marginTop: spacing.sm }]}>
              {formatSelectedTime()}
            </Text>

            {/* Done button */}
            <TouchableOpacity
              onPress={() => setTimeModalVisible(false)}
              style={[
                styles.doneBtn,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                  marginTop: spacing.md,
                },
              ]}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
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
  timeChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedTimeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentRowFull: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  segmentBtnLeft: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderRightWidth: 0.5,
  },
  segmentBtnRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderLeftWidth: 0.5,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  carouselHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  carouselItem: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    padding: 24,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentTimeLabel: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  doneBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SettingsScreen;
