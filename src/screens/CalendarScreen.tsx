import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { getTodayString, getDayOfWeek, formatDate, parseDate } from '../utils/dateUtils';
import { DayOfWeek } from '../types';

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOW_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildCalendarCells(year: number, month: number): (string | null)[] {
  // month is 0-indexed
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    cells.push(`${year}-${m}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleItem = {
  id: string;
  title: string;
  time?: string;
  kind: 'routine' | 'task';
  color?: string;
  completed?: boolean;
};

type CompletionStatus = 'none' | 'partial' | 'complete';

// ─── Screen ───────────────────────────────────────────────────────────────────

const CalendarScreen: React.FC = () => {
  const { colors, spacing, radius, isDark } = useTheme();
  const dailyItems = useStore((s) => s.dailyItems);
  const weeklyTemplate = useStore((s) => s.weeklyTemplate);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);

  const todayStr = getTodayString();
  const todayDate = parseDate(todayStr);

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const cells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setSelectedDate(todayStr);
  };

  const getCompletionStatus = (dateStr: string): CompletionStatus => {
    const items = dailyItems[dateStr];
    if (!items || items.length === 0) return 'none';
    const done = items.filter((it) => it.completed).length;
    if (done === 0) return 'none';
    if (done === items.length) return 'complete';
    return 'partial';
  };

  const selectedItems = useMemo<ScheduleItem[]>(() => {
    const dow = getDayOfWeek(selectedDate);

    const templateItems: ScheduleItem[] = weeklyTemplate[dow].map((ti) => ({
      id: `t-${ti.id}`,
      title: ti.title,
      time: ti.time,
      kind: 'routine',
    }));

    const taskItems: ScheduleItem[] = tasks
      .filter((t) => t.assignedDays.includes(dow) && t.level === 0)
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

    // Also include any manual daily items from completed/checked items
    const stored = dailyItems[selectedDate] ?? [];
    const manualItems: ScheduleItem[] = stored
      .filter(
        (it) =>
          it.source === 'rollover' ||
          (!templateItems.some((ti) => ti.id === `t-${it.templateItemId}`) &&
            !taskItems.some((tk) => tk.id === `tk-${it.taskId}`))
      )
      .map((it) => ({
        id: `s-${it.id}`,
        title: it.title,
        kind: 'routine' as const,
        completed: it.completed,
      }));

    return [...templateItems, ...taskItems, ...manualItems];
  }, [selectedDate, weeklyTemplate, tasks, projects, dailyItems]);

  const cellSize = Math.floor((Dimensions.get('window').width - spacing.md * 2) / 7);

  const renderCalendarCell = (dateStr: string | null, idx: number) => {
    if (!dateStr) {
      return <View key={`empty-${idx}`} style={{ width: cellSize, height: cellSize }} />;
    }

    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const status = getCompletionStatus(dateStr);
    const dayNum = parseInt(dateStr.split('-')[2], 10);

    const cellBg = isSelected
      ? colors.accent
      : isToday
      ? colors.accentLight
      : 'transparent';

    const numColor = isSelected
      ? '#fff'
      : isToday
      ? colors.accent
      : colors.text;

    let dotColor: string | null = null;
    if (status === 'complete') dotColor = colors.success;
    else if (status === 'partial') dotColor = colors.warning;

    return (
      <TouchableOpacity
        key={dateStr}
        onPress={() => setSelectedDate(dateStr)}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: cellBg,
            borderRadius: radius.full,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.cellNum, { color: numColor }]}>{dayNum}</Text>
        {dotColor && !isSelected && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
        {isSelected && status !== 'none' && (
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  status === 'complete' ? '#9effca' : '#ffe08a',
              },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

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

  const isCurrentMonthView =
    viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth();

  // Format the selected date label
  const selDate = parseDate(selectedDate);
  const selLabel = selDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const CalendarHeader = (
    <View>
      {/* Month navigation */}
      <View style={[styles.monthNav, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.navArrow, { color: colors.accent }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {MONTH_NAMES[viewMonth]} {viewYear}
            {!isCurrentMonthView && (
              <Text style={[styles.todayHint, { color: colors.textTertiary }]}>
                {'  '}(tap to return to today)
              </Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.navArrow, { color: colors.accent }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={[styles.dowRow, { paddingHorizontal: spacing.md }]}>
        {DOW_HEADERS.map((d, i) => (
          <View key={i} style={{ width: cellSize, alignItems: 'center' }}>
            <Text style={[styles.dowLabel, { color: colors.textTertiary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View
        style={[
          styles.grid,
          { paddingHorizontal: spacing.md, marginBottom: spacing.md },
        ]}
      >
        {cells.map((dateStr, idx) => renderCalendarCell(dateStr, idx))}
      </View>

      {/* Divider + selected day label */}
      <View
        style={[
          styles.divider,
          {
            borderTopColor: colors.separator,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xs,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.selLabel, { color: colors.text }]}>{selLabel}</Text>
        {selectedDate === todayStr && (
          <View style={[styles.todayBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.todayBadgeText, { color: colors.accent }]}>Today</Text>
          </View>
        )}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
      </View>

      <FlatList
        data={selectedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={CalendarHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nothing scheduled
            </Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
              Add items to the weekly template or assign tasks to this day.
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      />
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  navArrow: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  todayHint: {
    fontSize: 12,
    fontWeight: '400',
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dowLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cellNum: {
    fontSize: 14,
    fontWeight: '500',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  selLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default CalendarScreen;
