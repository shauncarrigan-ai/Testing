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
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { PROJECT_COLORS } from '../theme';
import {
  WEEK_DAYS,
  getDayOfWeek,
  getTodayString,
  addDays,
  parseDate,
  formatLongDate,
} from '../utils/dateUtils';
import { DayOfWeek, TemplateItem, RootStackParamList, MainTabParamList } from '../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Templates'>,
  StackNavigationProp<RootStackParamList>
>;

type ScheduleMode = 'recurring' | 'one-time' | 'project';
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
  const firstDay = new Date(year, month, 1).getDay();
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
  const navigation = useNavigation<Nav>();
  const todayDow = getDayOfWeek(getTodayString());

  const weeklyTemplate = useStore((s) => s.weeklyTemplate);
  const oneTimeItems = useStore((s) => s.oneTimeItems);
  const projects = useStore((s) => s.projects);
  const addTemplateItem = useStore((s) => s.addTemplateItem);
  const deleteTemplateItem = useStore((s) => s.deleteTemplateItem);
  const addOneTimeItem = useStore((s) => s.addOneTimeItem);
  const deleteOneTimeItem = useStore((s) => s.deleteOneTimeItem);
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const activeProjects = projects.filter((p) => !p.archived);
  const recurringItems = weeklyTemplate[todayDow];

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([todayDow]);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('one-time');

  // One-time date state
  const [dateMode, setDateMode] = useState<DateMode>('today');
  const [dueDate, setDueDate] = useState(getTodayString());

  // Calendar modal state
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarTempDate, setCalendarTempDate] = useState(getTodayString());

  // Project mode inline state
  const [inlineAddingProject, setInlineAddingProject] = useState(false);
  const [inlineProjectName, setInlineProjectName] = useState('');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [colorPickerProjectId, setColorPickerProjectId] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  const activeItems =
    scheduleMode === 'recurring'
      ? recurringItems
      : scheduleMode === 'one-time'
      ? oneTimeItems
      : [];

  const allSelected = selectedDays.length === 7;

  const toggleDay = (d: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
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
    } else if (scheduleMode === 'recurring') {
      if (selectedDays.length === 0) {
        Alert.alert(
          'No Day Selected',
          'Please choose at least one day of the week before adding.',
          [{ text: 'OK' }]
        );
        return;
      }
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

  const handleInlineCreateProject = () => {
    const name = inlineProjectName.trim();
    if (!name) return;
    const project = addProject(name, PROJECT_COLORS[0]);
    setInlineProjectName('');
    setInlineAddingProject(false);
    setFocusedProjectId(project.id);
    setColorPickerProjectId(project.id);
  };

  const handleAddInlineTask = () => {
    const title = inlineTaskTitle.trim();
    if (!title || !focusedProjectId) return;
    addTask(focusedProjectId, null, title);
    setInlineTaskTitle('');
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    Alert.alert(
      'Delete Project',
      `Delete "${projectTitle}" and all its tasks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (focusedProjectId === projectId) setFocusedProjectId(null);
            deleteProject(projectId);
          },
        },
      ]
    );
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(taskId),
        },
      ]
    );
  };

  const canAdd =
    newTitle.trim().length > 0 &&
    (scheduleMode === 'one-time' ? dueDate.trim().length > 0 : true);

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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Calendar')}
            style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}
            accessibilityLabel="View calendar"
          >
            <Text style={{ fontSize: 16 }}>🗓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Stats')}
            style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}
            accessibilityLabel="View stats"
          >
            <Text style={{ fontSize: 16 }}>📊</Text>
          </TouchableOpacity>
        </View>
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
            {/* Large title input — hidden in project mode */}
            {scheduleMode !== 'project' && (
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
                autoFocus={scheduleMode !== 'project'}
              />
            )}

            {/* Mode toggle: One-time / Recurring / Project */}
            <View style={[styles.modeToggleRow, { marginTop: spacing.md }]}>
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
              <TouchableOpacity
                onPress={() => setScheduleMode('project')}
                style={[
                  styles.modeBtn,
                  {
                    flex: 1,
                    backgroundColor: scheduleMode === 'project' ? colors.accent : colors.surfaceElevated,
                    borderColor: scheduleMode === 'project' ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={[styles.modeBtnText, { color: scheduleMode === 'project' ? '#fff' : colors.textSecondary }]}>
                  Project
                </Text>
              </TouchableOpacity>
            </View>

            {/* Separator — visually distinct break between mode buttons and controls */}
            <View style={{ height: 1.5, backgroundColor: colors.border, marginTop: spacing.md + 2, marginBottom: spacing.md, marginHorizontal: -spacing.md }} />

            {/* Date (one-time) or Day chips (recurring) or Project picker (project) */}
            {scheduleMode === 'one-time' ? (
              <View style={{ marginBottom: spacing.sm }}>
                <View style={[styles.fieldRow, { marginBottom: 6 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
                  <View style={styles.dateBtnRow}>
                    {(['today', 'tomorrow', 'date'] as DateMode[]).map((mode) => {
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
                {dateMode === 'date' && (
                  <Text style={[styles.dateDisplayLabel, { color: colors.accent, marginLeft: 54 }]}>
                    {formatLongDate(dueDate)}
                  </Text>
                )}
              </View>
            ) : scheduleMode === 'recurring' ? (
              <View style={{ marginBottom: spacing.sm }}>
                {/* Every day pill */}
                <TouchableOpacity
                  onPress={toggleAll}
                  style={[
                    styles.everydayPill,
                    {
                      backgroundColor: allSelected ? colors.accent : colors.surfaceElevated,
                      borderColor: allSelected ? colors.accent : colors.border,
                      borderRadius: radius.md,
                      marginBottom: 12,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.everydayPillText, { color: allSelected ? '#fff' : colors.textSecondary }]}>
                    Every day
                  </Text>
                  {allSelected && (
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
                {/* Circular day buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {DAY_CHIPS.map(({ label, day: d }) => {
                    const active = selectedDays.includes(d) && !allSelected;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => !allSelected && toggleDay(d)}
                        activeOpacity={0.75}
                        style={[
                          styles.dayCircle,
                          {
                            backgroundColor: active ? colors.accent : 'transparent',
                            borderColor: active ? colors.accent : colors.border,
                            opacity: allSelected ? 0.35 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.dayCircleText, { color: active ? '#fff' : colors.textSecondary }]}>
                          {label[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* ── Project mode ── inline project + task creation ── */
              <View>
                {inlineAddingProject ? (
                  <View style={[styles.addRow, { marginBottom: 8 }]}>
                    <TextInput
                      value={inlineProjectName}
                      onChangeText={setInlineProjectName}
                      placeholder="Project name…"
                      placeholderTextColor={colors.textTertiary}
                      style={[
                        styles.timeInput,
                        {
                          flex: 1,
                          backgroundColor: colors.surfaceElevated,
                          color: colors.text,
                          borderRadius: radius.sm,
                          borderColor: colors.border,
                        },
                      ]}
                      returnKeyType="done"
                      onSubmitEditing={handleInlineCreateProject}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={handleInlineCreateProject}
                      disabled={!inlineProjectName.trim()}
                      style={[
                        styles.addButton,
                        {
                          backgroundColor: inlineProjectName.trim() ? colors.accent : colors.border,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setInlineAddingProject(false); setInlineProjectName(''); }}
                      style={{ paddingHorizontal: 8, height: 40, justifyContent: 'center' }}
                    >
                      <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setInlineAddingProject(true)}
                    style={[
                      styles.newProjectBtn,
                      {
                        borderColor: colors.border,
                        borderRadius: radius.sm,
                        marginBottom: 8,
                      },
                    ]}
                  >
                    <Text style={[styles.newProjectBtnText, { color: colors.accent }]}>+ New Project</Text>
                  </TouchableOpacity>
                )}
                {activeProjects.map((proj) => {
                  const isFocused = focusedProjectId === proj.id;
                  const projTasks = tasks.filter(
                    (t) => t.projectId === proj.id && !t.completed && t.level === 0
                  );
                  return (
                    <View key={proj.id}>
                      <View
                        style={[
                          styles.projectRow,
                          {
                            backgroundColor: isFocused ? colors.accentLight : colors.surfaceElevated,
                            borderColor: isFocused ? colors.accent : colors.border,
                            borderRadius: radius.sm,
                            marginBottom: 6,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => setFocusedProjectId(isFocused ? null : proj.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}
                        >
                          <View style={[styles.projectDot, { backgroundColor: proj.color }]} />
                          <Text style={[styles.projectRowTitle, { color: colors.text, flex: 1 }]}>
                            {proj.title}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('ProjectDetail', { projectId: proj.id })}
                          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                        >
                          <Text style={{ color: colors.textTertiary, fontSize: 18, fontWeight: '300' }}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteProject(proj.id, proj.title)}
                          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                          style={{ paddingLeft: 6 }}
                        >
                          <Text style={{ color: colors.textTertiary, fontSize: 15 }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      {isFocused && (
                        <View style={{ marginLeft: 10, marginBottom: 8 }}>
                          {projTasks.map((task) => (
                            <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 6 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textTertiary }} />
                              <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{task.title}</Text>
                              <TouchableOpacity
                                onPress={() => handleDeleteTask(task.id, task.title)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Text style={{ color: colors.textTertiary, fontSize: 13 }}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                          <View style={[styles.addRow, { marginTop: 4 }]}>
                            <TextInput
                              value={inlineTaskTitle}
                              onChangeText={setInlineTaskTitle}
                              placeholder="Add task…"
                              placeholderTextColor={colors.textTertiary}
                              style={[
                                styles.timeInput,
                                {
                                  flex: 1,
                                  backgroundColor: colors.surfaceElevated,
                                  color: colors.text,
                                  borderRadius: radius.sm,
                                  borderColor: colors.border,
                                },
                              ]}
                              returnKeyType="done"
                              onSubmitEditing={handleAddInlineTask}
                              autoFocus
                            />
                            <TouchableOpacity
                              onPress={handleAddInlineTask}
                              disabled={!inlineTaskTitle.trim()}
                              style={[
                                styles.addButton,
                                {
                                  backgroundColor: inlineTaskTitle.trim() ? colors.accent : colors.border,
                                  borderRadius: radius.sm,
                                },
                              ]}
                            >
                              <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
                {activeProjects.length === 0 && !inlineAddingProject && (
                  <Text style={[styles.emptyText, { color: colors.textTertiary, textAlign: 'left' }]}>
                    No projects yet.
                  </Text>
                )}
              </View>
            )}

            {/* Add button — hidden in project mode */}
            {scheduleMode !== 'project' && <View style={styles.addRow}>
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
            </View>}
          </View>

          {/* ── Saved recurring items list ── */}
          {scheduleMode === 'recurring' && activeItems.length > 0 && (
            <View>
              <Text
                style={[
                  styles.savedLabel,
                  { color: colors.textTertiary, marginBottom: spacing.sm },
                ]}
              >
                RECURRING ITEMS
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

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Color Picker Modal ── */}
      <Modal
        visible={colorPickerProjectId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setColorPickerProjectId(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.colorPickerCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.colorPickerTitle, { color: colors.text }]}>
              Pick a color
            </Text>
            <View style={styles.colorSwatchGrid}>
              {PROJECT_COLORS.map((c) => {
                const currentColor = activeProjects.find((p) => p.id === colorPickerProjectId)?.color;
                const isSelected = currentColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      if (colorPickerProjectId) {
                        updateProject(colorPickerProjectId, { color: c });
                        setColorPickerProjectId(null);
                      }
                    }}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: c,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: '#fff',
                        transform: [{ scale: isSelected ? 1.15 : 1 }],
                      },
                    ]}
                  />
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setColorPickerProjectId(null)}
              style={{ marginTop: 16, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Date Picker Calendar Modal ── */}
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

            <View style={styles.calWeekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={[styles.calWeekLabel, { color: colors.textTertiary }]}>
                  {d}
                </Text>
              ))}
            </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 6,
  },
  modeBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 12,
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
  everydayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
  everydayPillText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Project mode
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  projectRowTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  newProjectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  newProjectBtnText: {
    fontSize: 13,
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
  // Color picker modal
  colorPickerCard: {
    padding: 24,
    margin: 32,
  },
  colorPickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorSwatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  // Calendar modal
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
