import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { WEEK_DAYS, getDayOfWeek, getTodayString } from '../utils/dateUtils';
import { DayOfWeek, TemplateItem } from '../types';

type ScheduleMode = 'recurring' | 'one-time';

const DAY_CHIPS: { label: string; day: DayOfWeek }[] = [
  { label: 'Mo', day: 'monday' },
  { label: 'Tu', day: 'tuesday' },
  { label: 'We', day: 'wednesday' },
  { label: 'Th', day: 'thursday' },
  { label: 'Fr', day: 'friday' },
  { label: 'Sa', day: 'saturday' },
  { label: 'Su', day: 'sunday' },
];

const getTodayDate = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TemplatesScreen: React.FC = () => {
  const { colors, spacing, radius, isDark } = useTheme();
  const todayDow = getDayOfWeek(getTodayString());

  const weeklyTemplate = useStore((s) => s.weeklyTemplate);
  const oneTimeItems = useStore((s) => s.oneTimeItems);
  const addTemplateItem = useStore((s) => s.addTemplateItem);
  const deleteTemplateItem = useStore((s) => s.deleteTemplateItem);
  const addOneTimeItem = useStore((s) => s.addOneTimeItem);
  const deleteOneTimeItem = useStore((s) => s.deleteOneTimeItem);

  const recurringItems = weeklyTemplate[todayDow];

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([todayDow]);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('one-time');
  const [dueDate, setDueDate] = useState(getTodayDate());
  const inputRef = useRef<TextInput>(null);

  const activeItems = scheduleMode === 'recurring' ? recurringItems : oneTimeItems;
  const allSelected = selectedDays.length === 7;

  const toggleDay = (d: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(d)
        ? prev.length === 1
          ? prev
          : prev.filter((x) => x !== d)
        : [...prev, d]
    );
  };

  const toggleAll = () => {
    setSelectedDays(allSelected ? [todayDow] : WEEK_DAYS);
  };

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const timeVal = newTime.trim() || undefined;

    if (scheduleMode === 'one-time') {
      const dateVal = dueDate.trim();
      if (!dateVal) return;
      addOneTimeItem(trimmed, dateVal, timeVal);
      setDueDate(getTodayDate());
    } else {
      selectedDays.forEach((d) => {
        addTemplateItem(d, trimmed, timeVal);
      });
      setSelectedDays([todayDow]);
    }
    setNewTitle('');
    setNewTime('');
    inputRef.current?.focus();
  };

  const handleDelete = (item: TemplateItem) => {
    Alert.alert('Remove Item', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (scheduleMode === 'one-time') {
            deleteOneTimeItem(item.id);
          } else {
            deleteTemplateItem(todayDow, item.id);
          }
        },
      },
    ]);
  };

  const canAdd =
    newTitle.trim().length > 0 &&
    (scheduleMode === 'recurring' || dueDate.trim().length > 0);

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
          Add To Do
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Add form ── */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            {/* Large title input */}
            <TextInput
              ref={inputRef}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="What do you need to do?"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.titleInputLarge,
                {
                  color: colors.text,
                  borderBottomColor: colors.separator,
                },
              ]}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              autoFocus
            />

            {/* Mode toggle: One-time (default) / Recurring */}
            <View style={[styles.modeToggleRow, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
              <TouchableOpacity
                onPress={() => setScheduleMode('one-time')}
                style={[
                  styles.modeBtn,
                  {
                    flex: 1,
                    backgroundColor: scheduleMode === 'one-time' ? colors.accent : colors.surfaceElevated,
                    borderColor: scheduleMode === 'one-time' ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={[styles.modeBtnText, { color: scheduleMode === 'one-time' ? '#fff' : colors.textSecondary }]}>
                  One-time
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setScheduleMode('recurring')}
                style={[
                  styles.modeBtn,
                  {
                    flex: 1,
                    backgroundColor: scheduleMode === 'recurring' ? colors.accent : colors.surfaceElevated,
                    borderColor: scheduleMode === 'recurring' ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={[styles.modeBtnText, { color: scheduleMode === 'recurring' ? '#fff' : colors.textSecondary }]}>
                  Recurring
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date (one-time) or Day chips (recurring) */}
            {scheduleMode === 'one-time' ? (
              <View style={[styles.fieldRow, { marginBottom: spacing.sm }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.fieldInput,
                    {
                      backgroundColor: colors.surfaceElevated,
                      color: colors.text,
                      borderRadius: radius.sm,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            ) : (
              <View style={[styles.fieldRow, { marginBottom: spacing.sm, alignItems: 'flex-start' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, paddingTop: 7 }]}>Repeat</Text>
                <View style={{ flex: 1 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
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
                      <Text style={[styles.dayChipText, { color: allSelected ? '#fff' : colors.textSecondary }]}>
                        Every day
                      </Text>
                    </TouchableOpacity>
                    {DAY_CHIPS.map(({ label, day: d }) => {
                      const active = selectedDays.includes(d) && !allSelected;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => !allSelected && toggleDay(d)}
                          style={[
                            styles.dayChip,
                            {
                              backgroundColor: active ? colors.accentLight : colors.surfaceElevated,
                              borderColor: active ? colors.accent : colors.border,
                              borderRadius: radius.sm,
                              opacity: allSelected ? 0.4 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.dayChipText, { color: active ? colors.accent : colors.textSecondary }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Optional time + Add button */}
            <View style={styles.addRow}>
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="Time (optional)"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.timeInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    color: colors.text,
                    borderRadius: radius.sm,
                    borderColor: colors.border,
                  },
                ]}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!canAdd}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: canAdd ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Saved items list ── */}
          {activeItems.length > 0 && (
            <View>
              <Text
                style={[
                  styles.savedLabel,
                  { color: colors.textTertiary, marginBottom: spacing.sm },
                ]}
              >
                {scheduleMode === 'one-time' ? 'ONE-TIME ITEMS' : 'RECURRING ITEMS'}
              </Text>
              {activeItems.map((item) => (
                <View
                  key={item.id}
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
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                    {item.dueDate && (
                      <Text style={[styles.itemMeta, { color: colors.textTertiary }]}>
                        📅 {item.dueDate}
                      </Text>
                    )}
                    {item.time && (
                      <Text style={[styles.itemMeta, { color: colors.textTertiary }]}>
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
              ))}
            </View>
          )}

          {activeItems.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {scheduleMode === 'one-time'
                ? 'No one-time items yet.'
                : 'No recurring items yet.'}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  formCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  titleInputLarge: {
    fontSize: 20,
    fontWeight: '500',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 44,
  },
  fieldInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  dayChips: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timeInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  addButton: {
    paddingHorizontal: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  savedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 4,
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
  itemMeta: { fontSize: 12, marginTop: 2 },
  deleteBtn: { fontSize: 16, paddingLeft: 12 },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TemplatesScreen;
