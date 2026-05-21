import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { KanbanColumn } from '../../src/components/tasks/KanbanColumn';
import { useTaskStore } from '../../src/store/taskStore';
import { TaskCategory, TaskColumn } from '../../src/features/tasks/types';

const CATEGORIES: TaskCategory[] = ['Logistics', 'Finance', 'Review', 'Creative', 'Engagement'];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Logistics: Colors.accentBlue,
  Finance: Colors.accentRed,
  Review: Colors.accentPurple,
  Creative: Colors.accentGreen,
  Engagement: '#f59e0b',
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, addTask } = useTaskStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Logistics');
  const [newColumn, setNewColumn] = useState<TaskColumn>('backlog');

  const backlogTasks = useMemo(() => tasks.filter((t) => t.column === 'backlog'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.column === 'in_progress'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.column === 'done'), [tasks]);

  const openModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Logistics');
    setNewColumn('backlog');
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided.',
      category: newCategory,
      column: newColumn,
      assignee_name: 'Me',
      assignee_initials: 'ME',
    });
    closeModal();
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Task Intelligence"
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={openModal} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ New Task</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 24, paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Task Intelligence</Text>
          <Text style={styles.pageSubtitle}>Overview of active initiatives and blocking issues.</Text>
        </View>

        <View style={styles.columns}>
          <KanbanColumn title="Backlog" column="backlog" tasks={backlogTasks} count={backlogTasks.length} />
          <KanbanColumn title="In Progress" column="in_progress" tasks={inProgressTasks} count={inProgressTasks.length} />
          <KanbanColumn title="Done" column="done" tasks={doneTasks} count={doneTasks.length} />
        </View>
      </ScrollView>

      {/* FAB alternative — inline button handled via TopBar */}

      {/* New Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalOverlay} onPress={closeModal} />

          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>New Task</Text>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="What needs to get done?"
                placeholderTextColor={Colors.textDisabled}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                maxLength={80}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                placeholder="Additional context (optional)"
                placeholderTextColor={Colors.textDisabled}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      newCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] + '25', borderColor: CATEGORY_COLORS[cat] },
                    ]}
                    onPress={() => setNewCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        newCategory === cat && { color: CATEGORY_COLORS[cat], fontWeight: '700' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Column */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ADD TO</Text>
              <View style={styles.chipRow}>
                {(['backlog', 'in_progress'] as TaskColumn[]).map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[styles.chip, newColumn === col && styles.chipActiveBlue]}
                    onPress={() => setNewColumn(col)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, newColumn === col && styles.chipTextBlue]}>
                      {col === 'backlog' ? '◦ Backlog' : '▶ In Progress'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} activeOpacity={0.75}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !newTitle.trim() && styles.saveBtnDisabled]}
                onPress={handleAddTask}
                disabled={!newTitle.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 24 },

  pageHeader: { gap: 4 },
  pageTitle: { ...Typography.h1, color: Colors.textPrimary, fontWeight: '600' },
  pageSubtitle: { ...Typography.bodyMedium, color: Colors.textSecondary },

  addBtn: {
    backgroundColor: Colors.accentBlueDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: {
    ...Typography.labelLarge,
    color: Colors.accentBlueDeeper,
    fontWeight: '700',
  },
  columns: { gap: 32 },

  // Modal
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: Colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bgSubtle,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
  },

  fieldGroup: { gap: 8 },
  fieldLabel: {
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  fieldInput: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  fieldInputMulti: {
    minHeight: 80,
    paddingTop: 12,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    ...Typography.labelMedium,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  chipActiveBlue: {
    backgroundColor: Colors.overlayBlue,
    borderColor: Colors.accentBlue,
  },
  chipTextBlue: {
    color: Colors.accentBlue,
    fontWeight: '700',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...Typography.labelLarge,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.accentBlueDark,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    ...Typography.labelLarge,
    color: Colors.accentBlueDeeper,
    fontWeight: '700',
  },
});
