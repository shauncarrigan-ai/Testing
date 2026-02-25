import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
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
import DragHandle from '../components/DragHandle';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import { DailyItem, RootStackParamList, MainTabParamList } from '../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Today'>,
  StackNavigationProp<RootStackParamList>
>;

const ITEM_H = 64;

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
    reorderDailyItems,
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

  const todayItems = useMemo(() => dailyItems[today] ?? [], [dailyItems, today]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = todayItems.length;
  const completed = todayItems.filter((i) => i.completed).length;
  const progress = total > 0 ? completed / total : 0;

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const localOrderRef = useRef<string[]>([]);
  const dragStartIdx = useRef(0);
  const lastDyRef = useRef(0);
  // Animated value drives the floating translateY of the dragged item
  const ghostAnim = useRef(new Animated.Value(0)).current;

  // Keep localOrder in sync with store when not dragging
  useEffect(() => {
    if (!activeDragId) {
      const ids = todayItems
        .filter((i) => !i.completed)
        .sort((a, b) => a.order - b.order)
        .map((i) => i.id);
      setLocalOrder(ids);
      localOrderRef.current = ids;
    }
  }, [todayItems, activeDragId]);

  const incompleteItemsOrdered = useMemo(() => {
    const incomplete = todayItems.filter((i) => !i.completed);
    const idToItem = new Map(incomplete.map((it) => [it.id, it]));
    return localOrder
      .map((id) => idToItem.get(id))
      .filter(Boolean) as DailyItem[];
  }, [todayItems, localOrder]);

  const completedItems = useMemo(
    () => todayItems.filter((i) => i.completed),
    [todayItems]
  );

  const handleDragStart = useCallback((id: string) => {
    const idx = localOrderRef.current.indexOf(id);
    const safeIdx = idx >= 0 ? idx : 0;
    dragStartIdx.current = safeIdx;
    lastDyRef.current = 0;
    ghostAnim.setValue(0);
    setActiveDragId(id);
  }, [ghostAnim]);

  // Item floats with finger; no live reorder — we commit on release
  const handleDragMove = useCallback((dy: number) => {
    lastDyRef.current = dy;
    ghostAnim.setValue(dy);
  }, [ghostAnim]);

  const handleDragEnd = useCallback(() => {
    const dy = lastDyRef.current;
    const targetIdx = Math.round(dy / ITEM_H) + dragStartIdx.current;
    const clamped = Math.max(
      0,
      Math.min(localOrderRef.current.length - 1, targetIdx)
    );
    const newOrder = [...localOrderRef.current];
    const movedId = newOrder.splice(dragStartIdx.current, 1)[0];
    newOrder.splice(clamped, 0, movedId);
    localOrderRef.current = newOrder;
    ghostAnim.setValue(0);
    setLocalOrder([...newOrder]);
    reorderDailyItems(today, newOrder);
    setActiveDragId(null);
  }, [ghostAnim, reorderDailyItems, today]);

  // ── Project color lookup ───────────────────────────────────────────────────
  const getProjectColor = useCallback(
    (projectId?: string) => {
      if (!projectId) return undefined;
      return projects.find((p) => p.id === projectId)?.color;
    },
    [projects]
  );

  // ── Optimistic completion (delay move to Done until animation finishes) ────
  const [optimisticCompleted, setOptimisticCompleted] = useState<Set<string>>(new Set());

  const handleToggle = (itemId: string, currentlyCompleted: boolean) => {
    if (currentlyCompleted) {
      toggleDailyItem(today, itemId);
    } else {
      setOptimisticCompleted((prev) => new Set(prev).add(itemId));
      setTimeout(() => {
        toggleDailyItem(today, itemId);
        setOptimisticCompleted((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 350);
    }
  };

  const handleLongPress = (item: DailyItem) => {
    Alert.alert(item.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
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

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Calendar')}
            style={[styles.statsButton, { backgroundColor: colors.surfaceElevated }]}
            accessibilityLabel="View calendar"
          >
            <Text style={{ fontSize: 16 }}>🗓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Stats')}
            style={[styles.statsButton, { backgroundColor: colors.surfaceElevated }]}
            accessibilityLabel="View stats"
          >
            <Text style={{ fontSize: 16 }}>📊</Text>
          </TouchableOpacity>
        </View>
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
        <ScrollView
          scrollEnabled={!activeDragId}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Incomplete items (draggable) ── */}
          {incompleteItemsOrdered.map((item) => {
            const isDragging = item.id === activeDragId;
            const effectiveCompleted =
              item.completed || optimisticCompleted.has(item.id);

            const rowContent = (
              <>
                <DragHandle
                  onDragStart={() => handleDragStart(item.id)}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  color={isDragging ? colors.accent : colors.textTertiary}
                />
                <View style={{ flex: 1 }}>
                  <CheckItem
                    title={item.title}
                    completed={effectiveCompleted}
                    source={item.source}
                    time={item.time}
                    rolledFromDate={
                      item.source === 'rollover'
                        ? item.rolledOverFromDate
                        : undefined
                    }
                    projectColor={getProjectColor(item.projectId)}
                    onToggle={() => handleToggle(item.id, effectiveCompleted)}
                    onLongPress={() => handleLongPress(item)}
                  />
                </View>
              </>
            );

            if (isDragging) {
              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.draggableRow,
                    {
                      transform: [{ translateY: ghostAnim }],
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      zIndex: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.18,
                      shadowRadius: 14,
                      elevation: 8,
                    },
                  ]}
                >
                  {rowContent}
                </Animated.View>
              );
            }

            return (
              <View key={item.id} style={styles.draggableRow}>
                {rowContent}
              </View>
            );
          })}

          {/* ── Done section ── */}
          {completedItems.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <View style={[styles.sectionHeader]}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  DONE
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                  {completedItems.length}
                </Text>
              </View>
              {completedItems.map((item) => {
                const effectiveCompleted =
                  item.completed || optimisticCompleted.has(item.id);
                return (
                  <CheckItem
                    key={item.id}
                    title={item.title}
                    completed={effectiveCompleted}
                    source={item.source}
                    time={item.time}
                    rolledFromDate={
                      item.source === 'rollover'
                        ? item.rolledOverFromDate
                        : undefined
                    }
                    projectColor={getProjectColor(item.projectId)}
                    onToggle={() => handleToggle(item.id, effectiveCompleted)}
                    onLongPress={() => handleLongPress(item)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
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
  draggableRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
