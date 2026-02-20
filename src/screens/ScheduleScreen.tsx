import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import {
  WEEK_DAYS,
  getShortDayLabel,
  getDayOfWeek,
  getTodayString,
} from '../utils/dateUtils';
import { DayOfWeek } from '../types';

type ScheduleItem = {
  id: string;
  title: string;
  time?: string;
  kind: 'routine' | 'task';
  color?: string;
  completed?: boolean;
};

const ScheduleScreen: React.FC = () => {
  const { colors, spacing, radius, isDark } = useTheme();
  const weeklyTemplate = useStore((s) => s.weeklyTemplate);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);

  const todayDow = getDayOfWeek(getTodayString());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDow);

  const dayItems = useMemo<ScheduleItem[]>(() => {
    const templateItems: ScheduleItem[] = weeklyTemplate[selectedDay].map((ti) => ({
      id: `t-${ti.id}`,
      title: ti.title,
      time: ti.time,
      kind: 'routine',
    }));

    const taskItems: ScheduleItem[] = tasks
      .filter((t) => t.assignedDays.includes(selectedDay) && t.level === 0)
      .map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return {
          id: `tk-${t.id}`,
          title: t.title,
          kind: 'task',
          color: project?.color,
          completed: t.completed,
        };
      });

    return [...templateItems, ...taskItems];
  }, [selectedDay, weeklyTemplate, tasks, projects]);

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          marginBottom: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          opacity: item.completed ? 0.45 : 1,
        },
      ]}
    >
      {item.color && (
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.rowTitle,
            {
              color: colors.text,
              textDecorationLine: item.completed ? 'line-through' : 'none',
            },
          ]}
        >
          {item.title}
        </Text>
        {item.time && (
          <Text style={[styles.rowTime, { color: colors.textTertiary }]}>
            ⏰ {item.time}
          </Text>
        )}
      </View>
      <View style={[styles.badge, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.badgeText, { color: colors.textTertiary }]}>
          {item.kind}
        </Text>
      </View>
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Schedule
        </Text>
      </View>

      {/* Day picker */}
      <View
        style={[
          styles.dayPicker,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        {WEEK_DAYS.map((day) => {
          const isSelected = day === selectedDay;
          const isToday = day === todayDow;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayTab,
                isSelected && {
                  borderBottomColor: colors.accent,
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayTabLabel,
                  {
                    color: isSelected
                      ? colors.accent
                      : isToday
                      ? colors.text
                      : colors.textTertiary,
                    fontWeight: isToday || isSelected ? '700' : '400',
                  },
                ]}
              >
                {getShortDayLabel(day)}
              </Text>
              {isToday && (
                <View
                  style={[
                    styles.todayDot,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : colors.textTertiary,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {dayItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nothing scheduled
          </Text>
          <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
            Add items to the weekly template or assign tasks to this day.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

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
  dayPicker: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dayTabLabel: {
    fontSize: 13,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowTime: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default ScheduleScreen;
