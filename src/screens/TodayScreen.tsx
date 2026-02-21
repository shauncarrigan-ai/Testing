import React, { useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import {
  getTodayString,
  addDays,
  formatLongDate,
} from '../utils/dateUtils';
import CheckItem from '../components/CheckItem';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import { DailyItem, RootStackParamList, MainTabParamList } from '../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Today'>,
  StackNavigationProp<RootStackParamList>
>;

// ─── Section list helpers ─────────────────────────────────────────────────────

type ListRow =
  | { kind: 'section'; id: string; title: string; count: number }
  | { kind: 'item'; id: string; item: DailyItem };

const TodayScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius, isDark } = useTheme();

  const {
    dailyItems,
    projects,
    generateDailyItems,
    toggleDailyItem,
    processRollover,
    lastProcessedDate,
  } = useStore();

  const today = getTodayString();
  const yesterday = addDays(today, -1);

  // ── On mount: rollover ────────────────────────────────────────────────────
  useEffect(() => {
    if (lastProcessedDate !== yesterday) {
      processRollover(yesterday, today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-generate on every focus so new template/task items appear immediately ─
  useFocusEffect(
    useCallback(() => {
      generateDailyItems(today);
    }, [generateDailyItems, today])
  );

  const todayItems = dailyItems[today] ?? [];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = todayItems.length;
  const completed = todayItems.filter((i) => i.completed).length;
  const progress = total > 0 ? completed / total : 0;

  // ── Build section list ─────────────────────────────────────────────────────
  const listData = useMemo<ListRow[]>(() => {
    const incomplete = (items: typeof todayItems) => items.filter((i) => !i.completed);

    const rolled = incomplete(todayItems.filter((i) => i.source === 'rollover'));
    const template = incomplete(todayItems.filter((i) => i.source === 'template'));
    const tasks = incomplete(todayItems.filter((i) => i.source === 'project_task'));
    const completedItems = todayItems.filter((i) => i.completed);

    const rows: ListRow[] = [];

    // Template items shown first with no section header
    template.forEach((it) => rows.push({ kind: 'item', id: it.id, item: it }));
    if (tasks.length) {
      rows.push({ kind: 'section', id: 'h-tasks', title: 'Projects', count: tasks.length });
      tasks.forEach((it) => rows.push({ kind: 'item', id: it.id, item: it }));
    }
    if (rolled.length) {
      rows.push({ kind: 'section', id: 'h-rolled', title: 'Carried over', count: rolled.length });
      rolled.forEach((it) => rows.push({ kind: 'item', id: it.id, item: it }));
    }
    // Completed items sink to the bottom
    if (completedItems.length) {
      rows.push({ kind: 'section', id: 'h-completed', title: 'Completed', count: completedItems.length });
      completedItems.forEach((it) => rows.push({ kind: 'item', id: it.id, item: it }));
    }
    return rows;
  }, [todayItems, today]);

  const getProjectColor = useCallback(
    (projectId?: string) => {
      if (!projectId) return undefined;
      return projects.find((p) => p.id === projectId)?.color;
    },
    [projects]
  );

  const handleToggle = (itemId: string) => {
    toggleDailyItem(today, itemId);
  };

  const handleLongPress = (item: DailyItem) => {
    Alert.alert(item.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderRow = ({ item: row }: { item: ListRow }) => {
    if (row.kind === 'section') {
      return (
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            {row.title.toUpperCase()}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
            {row.count}
          </Text>
        </View>
      );
    }
    return (
      <CheckItem
        title={row.item.title}
        completed={row.item.completed}
        source={row.item.source}
        time={row.item.time}
        rolledFromDate={row.item.source === 'rollover' ? row.item.rolledOverFromDate : undefined}
        projectColor={getProjectColor(row.item.projectId)}
        onToggle={() => handleToggle(row.item.id)}
        onLongPress={() => handleLongPress(row.item)}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.separator,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Today
          </Text>
          <Text style={[styles.headerDate, { color: colors.textTertiary }]}>
            {formatLongDate(today)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Stats')}
          style={[
            styles.statsButton,
            { backgroundColor: colors.surfaceElevated },
          ]}
          accessibilityLabel="View stats"
        >
          <Text style={{ fontSize: 16 }}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress ── */}
      {total > 0 && (
        <View
          style={[
            styles.progressRow,
            {
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.md,
              backgroundColor: colors.background,
            },
          ]}
        >
          <ProgressBar progress={progress} height={5} />
          <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
            {completed}/{total} done
          </Text>
        </View>
      )}

      {/* ── List ── */}
      {total === 0 ? (
        <EmptyState
          icon="✅"
          title="Nothing scheduled today"
          subtitle="Add items to your weekly template or assign project tasks to today."
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(row) => row.id}
          renderItem={renderRow}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDate: {
    fontSize: 15,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    paddingTop: 12,
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default TodayScreen;
