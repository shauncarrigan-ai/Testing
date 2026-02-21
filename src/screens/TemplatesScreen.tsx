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
  Modal,
} from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import {
  WEEK_DAYS,
  getDayOfWeek,
  getTodayString,
  addDays,
  formatDate,
  parseDate,
  formatLongDate,
} from '../utils/dateUtils';
import { DayOfWeek, TemplateItem } from '../types';

type ScheduleMode = 'recurring' | 'one-time';
type DateMode = 'today' | 'tomorrow' | 'date';

const DAY_CHIPS: { label: string; day: DayOfWeek }[] = [
  { label: 'Mo', day: 'monday' },
  { label: 'Tu', day: 'tuesday' },
  { label: 'We', day: 'wednesday' },
  { label: 'Th', day: 'thursday' },
  { label: 'Fr', day: 'friday' },
  { label: 'Sa', day: 'saturday' },
  { label: 'Su', day: 'sunday' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toDateStr = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const buildCalendarRows = (year: number, month: number): (number | null)[][] => {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
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

  // Date selection state
  const [dateMode, setDateMode] = useState<DateMode>('today');
  const [dueDate, setDueDate] = useState(getTodayString());

  // Calendar modal state
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarTempDate, setCalendarTempDate] = useState(getTodayString());

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

  const handleDateMode = (mode: DateMode) => {
    if (mode === 'today') {
      setDueDate(getTodayString());
      setDateMode('today');
    } else if (mode === 'tomorrow') {
      setDueDate(addDays(getTodayString(), 1));
      setDateMode('tomorrow');
    } else {
      // Open calendar seeded from current dueDate
      const d = parseDate(dueDate);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
      setCalendarTempDate(dueDate);
      setCalendarVisible(true);
      setDateMode('date');
    }
  };

  const handleCalendarSelect = () => {
    setDueDate(calendarTempDate);
    setCalendarVisible(false);
  };

  const handleCalendarCancel = () => {
    setCalendarVisible(false);
    // If they never confirmed a custom date, revert mode to today
    if (dateMode === 'date' && dueDate !== calendarTempDate) {
      // Keep whatever dueDate was before
    }
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const timeVal = newTime.trim() || undefined;

    if (scheduleMode === 'one-time') {
      const dateVal = dueDate.trim();
      if (!dateVal) return;
      addOneTimeItem(trimmed, dateVal, timeVal);
      setDueDate(getTodayString());
      setDateMode('today');
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

  const today = getTodayString();
  const calendarRows = buildCalendarRows(calendarYear, calendarMonth);

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
              <View style={{ marginBottom: spacing.sm }}>
                {/* Today / Tomorrow / Date… buttons */}
                <View style={[styles.fieldRow, { marginBottom: 6 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
                  <View style={styles.dateBtnRow}>
                    {([ 'today', 'tomorrow', 'date' ] as DateMode[]).map((mode) => {
                      const active = dateMode === mode;
                      const label = mode === 'today' ? 'Today' : mode === 'tomorrow' ? 'Tomorrow' : 'Date…';
                      return (
                        <TouchableOpacity
                          key={mode}
                          onPress={() => handleDateMode(mode)}
                          style={[
                            styles.dateBtn,
                            {
                              backgroundColor: active ? colors.accent : colors.surfaceElevated,
                              borderColor: active ? colors.accent : colors.border,
                              borderRadius: radius.sm,
                            },
                          ]}
                        >
                          <Text style={[styles.dateBtnText, { color: active ? '#fff' : colors.textSecondary }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {/* Show selected date label when using custom date */}
                {dateMode === 'date' && (
                  <Text style={[styles.dateDisplayLabel, { color: colors.accent, marginLeft: 54 }]}>
                    {formatLongDate(dueDate)}
                  </Text>
                )}
              </View>
            ) : (
              /* Recurring day chips — wrapped so all are visible */
              <View style={[styles.fieldRow, { marginBottom: spacing.sm, alignItems: 'flex-start' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, paddingTop: 7 }]}>Repeat</Text>
                <View style={styles.dayChipsWrap}>
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

      {/* ── Calendar Modal ── */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCalendarCancel}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.calendarCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Month navigation header */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                <Text style={[styles.calNavText, { color: colors.accent }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.calMonthTitle, { color: colors.text }]}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                <Text style={[styles.calNavText, { color: colors.accent }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday labels */}
            <View style={styles.calWeekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={[styles.calWeekLabel, { color: colors.textTertiary }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Day grid */}
            {calendarRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.calRow}>
                {row.map((day, colIdx) => {
                  const dateStr = day ? toDateStr(calendarYear, calendarMonth, day) : null;
                  const isSelected = dateStr === calendarTempDate;
                  const isToday = dateStr === today;
                  return (
                    <TouchableOpacity
                      key={colIdx}
                      onPress={() => dateStr && setCalendarTempDate(dateStr)}
                      disabled={!day}
                      style={[
                        styles.calDay,
                        {
                          backgroundColor: isSelected ? colors.accent : 'transparent',
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected || isToday ? '700' : '400',
                          color: isSelected
                            ? '#fff'
                            : isToday
                            ? colors.accent
                            : day
                            ? colors.text
                            : 'transparent',
                        }}
                      >
                        {day ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Footer */}
            <View style={styles.calFooter}>
              <TouchableOpacity onPress={handleCalendarCancel} style={styles.calFooterBtn}>
                <Text style={[styles.calCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCalendarSelect} style={styles.calFooterBtn}>
                <Text style={[styles.calSelectText, { color: colors.accent }]}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Date mode buttons
  dateBtnRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dateBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateDisplayLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // Day chips — wrapped layout so all are visible
  dayChipsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
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
  // Calendar modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    padding: 16,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calNavBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calNavText: {
    fontSize: 26,
    fontWeight: '300',
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calWeekLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  calDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  calFooterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  calCancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  calSelectText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default TemplatesScreen;
