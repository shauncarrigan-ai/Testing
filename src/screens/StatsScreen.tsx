import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { getTodayString, addDays, getDayOfWeek, getShortDayLabel, WEEK_DAYS } from '../utils/dateUtils';
import { DayOfWeek } from '../types';

interface DayStat {
  date: string;
  dow: DayOfWeek;
  total: number;
  completed: number;
  rate: number;
}

const StatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, spacing, radius, isDark } = useTheme();
  const dailyItems = useStore((s) => s.dailyItems);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);

  const today = getTodayString();

  // ── Compute last 14 days of stats ─────────────────────────────────────────
  const dayStats = useMemo<DayStat[]>(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, -13 + i);
      const items = dailyItems[date] ?? [];
      const total = items.length;
      const completed = items.filter((it) => it.completed).length;
      return {
        date,
        dow: getDayOfWeek(date),
        total,
        completed,
        rate: total > 0 ? completed / total : 0,
      };
    });
  }, [dailyItems, today]);

  // ── Overall stats ─────────────────────────────────────────────────────────
  const overallStats = useMemo(() => {
    const withItems = dayStats.filter((d) => d.total > 0);
    const totalItems = dayStats.reduce((s, d) => s + d.total, 0);
    const totalDone = dayStats.reduce((s, d) => s + d.completed, 0);
    const avgRate =
      withItems.length > 0
        ? withItems.reduce((s, d) => s + d.rate, 0) / withItems.length
        : 0;

    // Streak: consecutive days ending today with 100% completion
    let streak = 0;
    for (let i = dayStats.length - 1; i >= 0; i--) {
      const d = dayStats[i];
      if (d.date > today) continue;
      if (d.total > 0 && d.completed === d.total) streak++;
      else if (d.total === 0 && i === dayStats.length - 1) continue; // skip today if empty
      else break;
    }

    return { totalItems, totalDone, avgRate, streak };
  }, [dayStats, today]);

  // ── Per-day-of-week breakdown ─────────────────────────────────────────────
  const dowBreakdown = useMemo(() => {
    const map: Record<string, { total: number; done: number; count: number }> = {};
    dayStats.forEach((d) => {
      if (!map[d.dow]) map[d.dow] = { total: 0, done: 0, count: 0 };
      map[d.dow].total += d.total;
      map[d.dow].done += d.completed;
      if (d.total > 0) map[d.dow].count++;
    });
    return WEEK_DAYS.map((dow) => ({
      dow,
      label: getShortDayLabel(dow),
      rate:
        map[dow] && map[dow].total > 0
          ? map[dow].done / map[dow].total
          : null,
    }));
  }, [dayStats]);

  // ── Project completion ────────────────────────────────────────────────────
  const projectStats = useMemo(() => {
    return projects
      .filter((p) => !p.archived)
      .map((p) => {
        const pt = tasks.filter((t) => t.projectId === p.id && t.level === 0);
        const done = pt.filter((t) => t.completed).length;
        return {
          project: p,
          total: pt.length,
          done,
          rate: pt.length > 0 ? done / pt.length : 0,
        };
      })
      .filter((ps) => ps.total > 0);
  }, [projects, tasks]);

  const pct = (n: number) => `${Math.round(n * 100)}%`;

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
        <Text style={[styles.navTitle, { color: colors.text }]}>Stats</Text>
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
        {/* ── Summary cards ── */}
        <View style={styles.cardRow}>
          <StatCard
            label="14-day avg"
            value={pct(overallStats.avgRate)}
            colors={colors}
            radius={radius}
          />
          <StatCard
            label="Streak"
            value={`${overallStats.streak}d`}
            colors={colors}
            radius={radius}
            accent={overallStats.streak > 0}
          />
          <StatCard
            label="Items done"
            value={String(overallStats.totalDone)}
            colors={colors}
            radius={radius}
          />
        </View>

        {/* ── 14-day bar chart ── */}
        <SectionTitle title="Last 14 days" colors={colors} spacing={spacing} />
        <View
          style={[
            styles.chart,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.bars}>
            {dayStats.map((d) => {
              const isToday = d.date === today;
              const barH = d.total > 0 ? Math.max(4, d.rate * 60) : 4;
              return (
                <View key={d.date} style={styles.barWrap}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barBg,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barH,
                          backgroundColor:
                            d.total === 0
                              ? colors.border
                              : d.rate >= 1
                              ? colors.success
                              : isToday
                              ? colors.accent
                              : colors.accentDim,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color: isToday ? colors.accent : colors.textTertiary,
                        fontWeight: isToday ? '700' : '400',
                      },
                    ]}
                  >
                    {getShortDayLabel(d.dow).substring(0, 1)}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.barLegend}>
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>
              0%
            </Text>
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>
              100%
            </Text>
          </View>
        </View>

        {/* ── Day of week breakdown ── */}
        <SectionTitle title="By day of week" colors={colors} spacing={spacing} />
        <View
          style={[
            styles.dowGrid,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        >
          {dowBreakdown.map(({ dow, label, rate }) => (
            <View key={dow} style={styles.dowItem}>
              <Text style={[styles.dowLabel, { color: colors.textTertiary }]}>
                {label}
              </Text>
              <Text
                style={[
                  styles.dowRate,
                  {
                    color:
                      rate === null
                        ? colors.textTertiary
                        : rate >= 0.8
                        ? colors.success
                        : colors.text,
                  },
                ]}
              >
                {rate === null ? '–' : pct(rate)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Project completion ── */}
        {projectStats.length > 0 && (
          <>
            <SectionTitle title="Projects" colors={colors} spacing={spacing} />
            <View
              style={[
                styles.projectList,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                },
              ]}
            >
              {projectStats.map((ps, idx) => (
                <View
                  key={ps.project.id}
                  style={[
                    styles.projectStatRow,
                    {
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm + 4,
                      borderBottomWidth:
                        idx < projectStats.length - 1
                          ? StyleSheet.hairlineWidth
                          : 0,
                      borderBottomColor: colors.separator,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: ps.project.color },
                    ]}
                  />
                  <Text
                    style={[styles.projectName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {ps.project.title}
                  </Text>
                  <Text
                    style={[styles.projectRate, { color: colors.textSecondary }]}
                  >
                    {ps.done}/{ps.total}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
  accent?: boolean;
}> = ({ label, value, colors, radius, accent }) => (
  <View
    style={[
      styles.statCard,
      {
        backgroundColor: accent ? colors.accentLight : colors.surface,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: accent ? colors.accent : colors.border,
      },
    ]}
  >
    <Text style={[styles.statValue, { color: accent ? colors.accent : colors.text }]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const SectionTitle: React.FC<{
  title: string;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}> = ({ title, colors, spacing }) => (
  <Text
    style={[
      styles.sectionTitle,
      { color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.lg },
    ]}
  >
    {title.toUpperCase()}
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
  cardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chart: {},
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 68,
    gap: 4,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 3,
  },
  barFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 3,
  },
  barLabel: { fontSize: 10, marginTop: 4 },
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  legendText: { fontSize: 10 },
  dowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dowItem: { alignItems: 'center', paddingVertical: 12, flex: 1 },
  dowLabel: { fontSize: 11, marginBottom: 4 },
  dowRate: { fontSize: 14, fontWeight: '600' },
  projectList: { overflow: 'hidden' },
  projectStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  projectName: { flex: 1, fontSize: 15 },
  projectRate: { fontSize: 13, fontWeight: '500' },
});

export default StatsScreen;
