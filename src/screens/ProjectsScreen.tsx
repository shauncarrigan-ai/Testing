import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { PROJECT_COLORS } from '../theme';
import EmptyState from '../components/EmptyState';
import { Project, RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

// ─── New Project Modal ────────────────────────────────────────────────────────

interface NewProjectModalProps {
  visible: boolean;
  onClose: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ visible, onClose }) => {
  const { colors, spacing, radius } = useTheme();
  const addProject = useStore((s) => s.addProject);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const handleCreate = () => {
    if (!title.trim()) return;
    addProject(title.trim(), color);
    setTitle('');
    setColor(PROJECT_COLORS[0]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: colors.separator, paddingHorizontal: spacing.md },
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>New Project</Text>
          <TouchableOpacity onPress={handleCreate} disabled={!title.trim()}>
            <Text
              style={[
                styles.modalDone,
                { color: title.trim() ? colors.accent : colors.textTertiary },
              ]}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: spacing.md }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Project name…"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            style={[
              styles.nameInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
              },
            ]}
          />

          <Text
            style={[
              styles.colorLabel,
              { color: colors.textTertiary, marginTop: spacing.lg },
            ]}
          >
            COLOR
          </Text>
          <View style={styles.colorRow}>
            {PROJECT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ProjectsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius, isDark } = useTheme();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const archiveProject = useStore((s) => s.archiveProject);
  const deleteProject = useStore((s) => s.deleteProject);

  const [showModal, setShowModal] = useState(false);

  const active = projects.filter((p) => !p.archived);

  const getTaskSummary = (projectId: string) => {
    const pt = tasks.filter((t) => t.projectId === projectId && t.level === 0);
    const done = pt.filter((t) => t.completed).length;
    return { total: pt.length, done };
  };

  const handleLongPress = (project: Project) => {
    Alert.alert(project.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: () => archiveProject(project.id),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Delete Project',
            'This will permanently delete the project and all its tasks.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteProject(project.id),
              },
            ]
          ),
      },
    ]);
  };

  const renderProject = ({ item }: { item: Project }) => {
    const { total, done } = getTaskSummary(item.id);
    const progress = total > 0 ? done / total : 0;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ProjectDetail', { projectId: item.id })
        }
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
        style={[
          styles.projectCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            marginBottom: spacing.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          },
        ]}
      >
        {/* Color accent */}
        <View
          style={[
            styles.projectAccent,
            { backgroundColor: item.color, borderRadius: radius.full },
          ]}
        />

        <View style={styles.projectBody}>
          <View style={styles.projectTop}>
            <Text style={[styles.projectTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
          </View>

          {total > 0 && (
            <View style={styles.projectMeta}>
              {/* Mini progress bar */}
              <View
                style={[
                  styles.miniTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.miniFill,
                    {
                      backgroundColor:
                        progress >= 1 ? colors.success : item.color,
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.taskCount, { color: colors.textTertiary }]}
              >
                {done}/{total} tasks
              </Text>
            </View>
          )}

          {total === 0 && (
            <Text style={[styles.noTasks, { color: colors.textTertiary }]}>
              No tasks yet
            </Text>
          )}
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
            borderBottomColor: colors.separator,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Projects
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[
            styles.newBtn,
            { backgroundColor: colors.accent, borderRadius: radius.full },
          ]}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {active.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          subtitle="Tap '+ New' to create your first project."
        />
      ) : (
        <FlatList
          data={active}
          keyExtractor={(p) => p.id}
          renderItem={renderProject}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <NewProjectModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  newBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  projectAccent: {
    width: 4,
    height: 40,
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  projectBody: { flex: 1 },
  projectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chevron: { fontSize: 20 },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  miniTrack: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
  miniFill: {
    height: 3,
    borderRadius: 99,
  },
  taskCount: { fontSize: 12, minWidth: 60, textAlign: 'right' },
  noTasks: { fontSize: 13, marginTop: 4 },
  // Modal
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalDone: { fontSize: 16, fontWeight: '600' },
  nameInput: {
    height: 48,
    fontSize: 16,
    borderWidth: 1,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ProjectsScreen;
