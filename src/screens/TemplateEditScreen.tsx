import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { getDayLabel, WEEK_DAYS } from '../utils/dateUtils';
import { DayOfWeek, RootStackParamList, TemplateItem } from '../types';

type Route = RouteProp<RootStackParamList, 'TemplateEdit'>;
type Nav = StackNavigationProp<RootStackParamList>;

// Short labels for the day chips
const DAY_CHIPS: { label: string; day: DayOfWeek }[] = [
  { label: 'Mo', day: 'monday' },
  { label: 'Tu', day: 'tuesday' },
  { label: 'We', day: 'wednesday' },
  { label: 'Th', day: 'thursday' },
  { label: 'Fr', day: 'friday' },
  { label: 'Sa', day: 'saturday' },
  { label: 'Su', day: 'sunday' },
];

const TemplateEditScreen: React.FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { day } = route.params;
  const { colors, spacing, radius, isDark } = useTheme();

  const weeklyTemplate = useStore((s) => s.weeklyTemplate);
  const addTemplateItem = useStore((s) => s.addTemplateItem);
  const deleteTemplateItem = useStore((s) => s.deleteTemplateItem);

  const items = weeklyTemplate[day];

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([day]);
  const inputRef = useRef<TextInput>(null);

  const allSelected = selectedDays.length === 7;

  const toggleDay = (d: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(d)
        ? prev.length === 1
          ? prev // keep at least one day
          : prev.filter((x) => x !== d)
        : [...prev, d]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedDays([day]);
    } else {
      setSelectedDays(WEEK_DAYS);
    }
  };

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const timeVal = newTime.trim() || undefined;
    selectedDays.forEach((d) => {
      addTemplateItem(d, trimmed, timeVal);
    });
    setNewTitle('');
    setNewTime('');
    setSelectedDays([day]);
    inputRef.current?.focus();
  };

  const handleDelete = (item: TemplateItem) => {
    Alert.alert('Remove Item', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteTemplateItem(day, item.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: TemplateItem }) => (
    <View
      style={[
        styles.itemRow,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          marginBottom: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        {item.time && (
          <Text style={[styles.itemTime, { color: colors.textTertiary }]}>
            ⏰ {item.time}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={[styles.deleteBtn, { color: colors.textTertiary }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Nav header */}
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
        <Text style={[styles.navTitle, { color: colors.text }]}>
          {getDayLabel(day)}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No items yet. Add your first checklist item below.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Add new item */}
        <View
          style={[
            styles.addBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.separator,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
            },
          ]}
        >
          {/* Day selector */}
          <View style={styles.dayRow}>
            <Text style={[styles.dayRowLabel, { color: colors.textTertiary }]}>
              Add to:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
              {/* Everyday chip */}
              <TouchableOpacity
                onPress={toggleAll}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: allSelected ? colors.accent : colors.surfaceElevated,
                    borderColor: allSelected ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    { color: allSelected ? '#fff' : colors.textSecondary },
                  ]}
                >
                  Everyday
                </Text>
              </TouchableOpacity>

              {/* Individual day chips */}
              {DAY_CHIPS.map(({ label, day: d }) => {
                const active = selectedDays.includes(d) && !allSelected;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => !allSelected && toggleDay(d)}
                    style={[
                      styles.dayChip,
                      styles.dayChipSm,
                      {
                        backgroundColor: active
                          ? colors.accentLight
                          : colors.surfaceElevated,
                        borderColor: active ? colors.accent : colors.border,
                        borderRadius: radius.sm,
                        opacity: allSelected ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        { color: active ? colors.accent : colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Title + time + add button */}
          <View style={styles.addRow}>
            <TextInput
              ref={inputRef}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="New checklist item…"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.titleInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderRadius: radius.sm,
                },
              ]}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TextInput
              value={newTime}
              onChangeText={setNewTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.timeInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderRadius: radius.sm,
                },
              ]}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!newTitle.trim()}
              style={[
                styles.addButton,
                {
                  backgroundColor: newTitle.trim()
                    ? colors.accent
                    : colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.timeHint, { color: colors.textTertiary }]}>
            Time is optional – used for per-item reminders
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { fontSize: 17, fontWeight: '400' },
  navTitle: { fontSize: 17, fontWeight: '600' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 15 },
  itemTime: { fontSize: 12, marginTop: 2 },
  deleteBtn: { fontSize: 16, paddingLeft: 12 },
  addBar: { borderTopWidth: StyleSheet.hairlineWidth },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dayRowLabel: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
  },
  dayChips: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  dayChipSm: {
    paddingHorizontal: 8,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  titleInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  timeInput: {
    width: 64,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 26,
  },
  timeHint: { fontSize: 11, marginTop: 2 },
});

export default TemplateEditScreen;
