import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { WEEK_DAYS, getDayLabel, getDayOfWeek, getTodayString } from '../utils/dateUtils';
import { DayOfWeek, RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

const TemplatesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius, isDark } = useTheme();
  const weeklyTemplate = useStore((s) => s.weeklyTemplate);
  const todayDow = getDayOfWeek(getTodayString());

  const renderDay = ({ item: day }: { item: DayOfWeek }) => {
    const items = weeklyTemplate[day];
    const isToday = day === todayDow;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TemplateEdit', { day })}
        activeOpacity={0.7}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            marginBottom: spacing.sm,
            borderWidth: isToday ? 1.5 : StyleSheet.hairlineWidth,
            borderColor: isToday ? colors.accent : colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 4,
          },
        ]}
      >
        <View style={styles.cardLeft}>
          <Text
            style={[
              styles.dayLabel,
              { color: isToday ? colors.accent : colors.text },
            ]}
          >
            {getDayLabel(day)}
          </Text>
          {isToday && (
            <View
              style={[
                styles.todayBadge,
                { backgroundColor: colors.accentLight },
              ]}
            >
              <Text style={[styles.todayText, { color: colors.accent }]}>
                Today
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.itemCount, { color: colors.textTertiary }]}>
            {items.length === 0
              ? 'Empty'
              : `${items.length} item${items.length !== 1 ? 's' : ''}`}
          </Text>
          <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
        </View>
      </TouchableOpacity>
    );
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
            backgroundColor: colors.background,
            borderBottomColor: colors.separator,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New To Dos
        </Text>
        <Text style={[styles.headerSub, { color: colors.textTertiary }]}>
          Tap a day to add or edit items
        </Text>
      </View>

      <FlatList
        data={WEEK_DAYS}
        keyExtractor={(d) => d}
        renderItem={renderDay}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
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
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  todayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
});

export default TemplatesScreen;
