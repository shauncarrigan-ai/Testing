import React, { useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { WEEK_DAYS, getDayLabel } from '../utils/dateUtils';
import { DayOfWeek, RootStackParamList, Task } from '../types';

type Route = RouteProp<RootStackParamList, 'ProjectDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

// ─── Assign Days Modal ────────────────────────────────────────────────────────

interface AssignDaysModalProps {
  task: Task | null;
  onClose: () => void;
}

const AssignDaysModal: React.FC<AssignDaysModalProps> = ({ task, onClose }) => {
  const { colors, spacing, radius } = useTheme();
  const assignTaskToDays = useStore((s) => s.assignTaskToDays);
  const [selected, setSelected] = useState<DayOfWeek[]>(task?.assignedDays ?? []);

  if (!task) return null;

  const toggle = (day: DayOfWeek) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    assignTaskToDays(task.id, selected);
    onClose();
  };

  return (
    <Modal
      visible={!!task}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalSafe, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.modalHeader,
            {
              borderBottomColor: colors.separator,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Assign to Daily
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveText, { color: colors.accent }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.taskNameLabel,
            { color: colors.textTertiary, paddingHorizontal: spacing.md },
          ]}
        >
          {task.title}
        </Text>

        {/* Quick-select buttons */}
        <View style={[styles.quickRow, { paddingHorizontal: spacing.md }]}>
          {[
            { label: 'Every day', days: WEEK_DAYS },
            { label: 'Weekdays', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[] },
            { label: 'Weekends', days: ['saturday', 'sunday'] as DayOfWeek[] },
            { label: 'None', days: [] as DayOfWeek[] },
          ].map(({ label, days: qDays }) => {
            const isActive =
              qDays.length > 0 &&
              qDays.length === selected.length &&
              qDays.every((d) => selected.includes(d));
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setSelected(qDays)}
                style={[
                  styles.quickBtn,
                  {
                    backgroundColor: isActive ? colors.accentLight : colors.surfaceElevated,
                    borderColor: isActive ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={[styles.quickBtnText, { color: isActive ? colors.accent : colors.textSecondary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.daysGrid, { paddingHorizontal: spacing.md }]}>
          {WEEK_DAYS.map((day) => {
            const active = selected.includes(day);
            return (
              <TouchableOpacity
                key={day}
                onPress={() => toggle(day)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: active
                      ? colors.accent
                      : colors.surfaceElevated,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {getDayLabel(day).substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Task Row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  projectColor: string;
  childTasks: Task[];
  grandchildMap: Record<string, Task[]>;
  onAssign: (task: Task) => void;
  onAddChild: (parentId: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  projectColor,
  childTasks,
  grandchildMap,
  onAssign,
  onAddChild,
}) => {
  const { colors, spacing, radius } = useTheme();
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [expanded, setExpanded] = useState(false);

  const hasChildren = childTasks.length > 0;
  const indentLeft = task.level * 20;

  const handleLongPress = () => {
    Alert.alert(task.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign to Daily Schedule',
        onPress: () => onAssign(task),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Task', `Delete "${task.title}" and all subtasks?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteTask(task.id),
            },
          ]),
      },
    ]);
  };

  return (
    <View style={{ marginLeft: indentLeft }}>
      <TouchableOpacity
        onPress={() => {
          toggleTask(task.id);
        }}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        style={[
          styles.taskRow,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            marginBottom: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Level indicator */}
        {task.level > 0 && (
          <View
            style={[
              styles.levelLine,
              { backgroundColor: projectColor + '66' },
            ]}
          />
        )}

        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              borderColor: task.completed ? colors.success : colors.border,
              backgroundColor: task.completed ? colors.success : 'transparent',
              borderRadius: task.level === 0 ? 5 : 99,
            },
          ]}
        >
          {task.completed && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>

        {/* Title */}
        <Text
          style={[
            styles.taskTitle,
            {
              color: task.completed ? colors.textTertiary : colors.text,
              textDecorationLine: task.completed ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <View style={styles.taskActions}>
          {/* Day assignment indicator */}
          {task.assignedDays.length > 0 && (
            <TouchableOpacity onPress={() => onAssign(task)}>
              <View
                style={[
                  styles.assignedBadge,
                  { backgroundColor: colors.accentLight },
                ]}
              >
                <Text style={[styles.assignedText, { color: colors.accent }]}>
                  📅 {task.assignedDays.length}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Expand toggle */}
          {hasChildren && (
            <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
              <Text style={[styles.expandBtn, { color: colors.textTertiary }]}>
                {expanded ? '▾' : '▸'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Children */}
      {expanded && (
        <View>
          {childTasks.map((child) => (
            <TaskRow
              key={child.id}
              task={child}
              projectColor={projectColor}
              childTasks={grandchildMap[child.id] ?? []}
              grandchildMap={{}}
              onAssign={onAssign}
              onAddChild={onAddChild}
            />
          ))}
          {/* Add subtask button (only if level < 1 to allow one more level) */}
          {task.level < 1 && (
            <TouchableOpacity
              onPress={() => onAddChild(task.id)}
              style={[styles.addSubBtn, { marginLeft: 20 }]}
            >
              <Text style={[styles.addSubText, { color: colors.accent }]}>
                + Add subtask
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ProjectDetailScreen: React.FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius, isDark } = useTheme();
  const { projectId } = route.params;

  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const tasks = useStore((s) => s.tasks.filter((t) => t.projectId === projectId));
  const addTask = useStore((s) => s.addTask);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(
    undefined
  );
  const [assignTarget, setAssignTarget] = useState<Task | null>(null);

  const rootTasks = useMemo(
    () => tasks.filter((t) => t.parentId === null).sort((a, b) => a.order - b.order),
    [tasks]
  );

  const childMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks
      .filter((t) => t.parentId !== null)
      .forEach((t) => {
        const pid = t.parentId!;
        if (!map[pid]) map[pid] = [];
        map[pid].push(t);
        map[pid].sort((a, b) => a.order - b.order);
      });
    return map;
  }, [tasks]);

  const grandchildMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks
      .filter((t) => t.level === 2)
      .forEach((t) => {
        const pid = t.parentId!;
        if (!map[pid]) map[pid] = [];
        map[pid].push(t);
      });
    return map;
  }, [tasks]);

  const handleAddTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed || !project) return;
    addTask(projectId, addingParentId ?? null, trimmed);
    setNewTaskTitle('');
    setAddingParentId(undefined);
  };

  if (!project) return null;

  const doneRoot = rootTasks.filter((t) => t.completed).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Nav Header */}
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
        <View style={styles.navTitleRow}>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: project.color },
            ]}
          />
          <Text
            style={[styles.navTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {project.title}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress summary */}
      {rootTasks.length > 0 && (
        <View
          style={[
            styles.progressRow,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomColor: colors.separator,
              borderBottomWidth: StyleSheet.hairlineWidth,
            },
          ]}
        >
          <Text style={[styles.progressText, { color: colors.textTertiary }]}>
            {doneRoot} of {rootTasks.length} tasks done
          </Text>
        </View>
      )}

      <FlatList
        data={rootTasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            projectColor={project.color}
            childTasks={childMap[item.id] ?? []}
            grandchildMap={grandchildMap}
            onAssign={setAssignTarget}
            onAddChild={(parentId) => {
              setAddingParentId(parentId);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyTaskState colors={colors} />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Add task bar */}
      <View
        style={[
          styles.addBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.separator,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        {addingParentId !== undefined && addingParentId !== null && (
          <Text style={[styles.addingUnder, { color: colors.accent }]}>
            Adding subtask under:{' '}
            {tasks.find((t) => t.id === addingParentId)?.title ?? ''}
            {'  '}
            <Text
              onPress={() => setAddingParentId(undefined)}
              style={{ color: colors.textTertiary }}
            >
              (cancel)
            </Text>
          </Text>
        )}
        <View style={styles.addRow}>
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder={
              addingParentId != null ? 'New subtask…' : 'New task…'
            }
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.taskInput,
              {
                backgroundColor: colors.surfaceElevated,
                color: colors.text,
                borderRadius: radius.sm,
              },
            ]}
            returnKeyType="done"
            onSubmitEditing={handleAddTask}
          />
          <TouchableOpacity
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
            style={[
              styles.addBtn,
              {
                backgroundColor: newTaskTitle.trim()
                  ? project.color
                  : colors.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AssignDaysModal
        task={assignTarget}
        onClose={() => setAssignTarget(null)}
      />
    </SafeAreaView>
  );
};

const EmptyTaskState: React.FC<{ colors: ReturnType<typeof useTheme>['colors'] }> = ({
  colors,
}) => (
  <View style={{ padding: 32, alignItems: 'center' }}>
    <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
    <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
      No tasks yet
    </Text>
    <Text
      style={{
        color: colors.textTertiary,
        fontSize: 14,
        marginTop: 6,
        textAlign: 'center',
      }}
    >
      Add tasks below. Long-press any task to assign it to your daily schedule.
    </Text>
  </View>
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
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  navTitle: { fontSize: 17, fontWeight: '600' },
  progressRow: {},
  progressText: { fontSize: 13 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  levelLine: {
    width: 2,
    height: 18,
    borderRadius: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  assignedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandBtn: {
    fontSize: 14,
    paddingLeft: 4,
  },
  addSubBtn: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  addSubText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addingUnder: { fontSize: 12, marginBottom: 4, fontWeight: '500' },
  addRow: { flexDirection: 'row', gap: 8 },
  taskInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 26,
  },
  // Modal
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  saveText: { fontSize: 16, fontWeight: '600' },
  taskNameLabel: {
    fontSize: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  dayChipText: { fontSize: 14, fontWeight: '600' },
});

export default ProjectDetailScreen;
