import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Bell, Plus, Search, Check, Clock } from 'lucide-react-native';
import { useTaskStore } from '../../src/store/taskStore';
import { TaskCategory, TaskColumn } from '../../src/features/tasks/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#7C5CFC';
const P_DIM  = 'rgba(124,92,252,0.15)';
const CARD   = '#13131F';
const BDR    = 'rgba(255,255,255,0.07)';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8B8BAA';
const TEXT3  = '#3D3D5C';
const BG     = '#0a0a0a';

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Logistics:  '#60A5FA',
  Finance:    '#F87171',
  Review:     '#A78BFA',
  Creative:   '#34D399',
  Engagement: '#FBBF24',
};
const CATEGORIES: TaskCategory[] = ['Logistics', 'Finance', 'Review', 'Creative', 'Engagement'];

// ── Date strip helpers ────────────────────────────────────────────────────────
function getWeekDays() {
  const today = new Date();
  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Filter config ─────────────────────────────────────────────────────────────
type Filter = 'all' | 'backlog' | 'in_progress' | 'done';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'backlog',     label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done',        label: 'Done' },
];

// ── Task list item ─────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle }: { task: any; onToggle: () => void }) {
  const color  = CATEGORY_COLORS[task.category as TaskCategory] ?? P;
  const isDone = task.column === 'done';
  const statusLabel =
    task.column === 'done'        ? 'Done'
    : task.column === 'in_progress' ? 'In Progress'
    : 'To Do';
  const statusColor =
    task.column === 'done'        ? '#34D399'
    : task.column === 'in_progress' ? P
    : TEXT3;

  return (
    <View style={[styles.taskItem, { borderLeftColor: color }]}>
      <TouchableOpacity
        style={[styles.taskCheck, isDone && { backgroundColor: '#34D39920', borderColor: '#34D399' }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {isDone && <Check size={11} color="#34D399" strokeWidth={3} />}
      </TouchableOpacity>
      <View style={styles.taskBody}>
        <Text style={[styles.taskCategory, { color }]}>{task.category}</Text>
        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.description && task.description !== 'No description provided.' && (
          <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
function AddTaskModal({
  visible, onClose, onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, desc: string, category: TaskCategory, column: TaskColumn) => void;
}) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [category, setCategory] = useState<TaskCategory>('Logistics');
  const [column, setColumn]     = useState<TaskColumn>('backlog');

  const submit = () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(title.trim(), desc.trim(), category, column);
    setTitle(''); setDesc(''); setCategory('Logistics'); setColumn('backlog');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalOverlay} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>New Task</Text>

          <TextInput
            style={styles.input}
            placeholder="Task title..."
            placeholderTextColor={TEXT3}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={[styles.input, { minHeight: 72, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="Description (optional)"
            placeholderTextColor={TEXT3}
            value={desc}
            onChangeText={setDesc}
            multiline
          />

          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((c) => {
              const col = CATEGORY_COLORS[c];
              const active = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, active && { backgroundColor: col + '20', borderColor: col }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, active && { color: col, fontWeight: '700' }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldLabel}>ADD TO</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['backlog', 'in_progress'] as TaskColumn[]).map((col) => (
              <TouchableOpacity
                key={col}
                style={[styles.chip, column === col && { backgroundColor: P_DIM, borderColor: P }]}
                onPress={() => setColumn(col)}
              >
                <Text style={[styles.chipText, column === col && { color: P, fontWeight: '700' }]}>
                  {col === 'backlog' ? 'To Do' : 'In Progress'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !title.trim() && { opacity: 0.4 }]}
              onPress={submit}
              disabled={!title.trim()}
            >
              <Text style={styles.addBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, addTask, moveTask } = useTaskStore();

  const [filter, setFilter]   = useState<Filter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch]   = useState('');

  const weekDays = useMemo(() => getWeekDays(), []);
  const todayIdx = 3; // centre of the 7-day window

  const filtered = useMemo(() => {
    let list = filter === 'all' ? tasks : tasks.filter((t) => t.column === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, filter, search]);

  const handleToggle = (task: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next: TaskColumn = task.column === 'done' ? 'backlog' : 'done';
    moveTask(task.id, next);
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Bell size={18} color={TEXT2} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* ── Date strip ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}
      >
        {weekDays.map((d, i) => {
          const isToday = i === todayIdx;
          return (
            <View key={i} style={[styles.dayCell, isToday && styles.dayCellActive]}>
              <Text style={[styles.dayName, isToday && { color: '#fff' }]}>
                {DAY_NAMES[d.getDay()]}
              </Text>
              <Text style={[styles.dayNum, isToday && { color: '#fff', fontWeight: '700' }]}>
                {d.getDate()}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count  = f.key === 'all'
            ? tasks.length
            : tasks.filter((t) => t.column === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              {count > 0 && (
                <View style={[styles.filterCount, active && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, active && { color: '#fff' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Search size={14} color={TEXT2} strokeWidth={1.8} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={TEXT3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ── Task list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Clock size={32} color={TEXT3} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No tasks here</Text>
            <Text style={styles.emptyBody}>Tap + to add your first task</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskItem task={item} onToggle={() => handleToggle(item)} />
        )}
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAdd(true);
        }}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(title, desc, category, column) =>
          addTask({ title, description: desc || 'No description provided.', category, column, assignee_name: 'Me', assignee_initials: 'ME' })
        }
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT, letterSpacing: -0.3 },
  bellBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    alignItems: 'center', justifyContent: 'center',
  },

  // Date strip
  dateStrip: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  dayCell: {
    alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14, minWidth: 50,
  },
  dayCellActive: { backgroundColor: P },
  dayName: { fontSize: 11, fontWeight: '600', color: TEXT2 },
  dayNum: { fontSize: 16, fontWeight: '600', color: TEXT2 },

  // Filters
  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
  },
  filterChipActive: { backgroundColor: P_DIM, borderColor: P },
  filterText: { fontSize: 13, fontWeight: '600', color: TEXT2 },
  filterTextActive: { color: P },
  filterCount: { backgroundColor: BDR, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  filterCountActive: { backgroundColor: P },
  filterCountText: { fontSize: 10, fontWeight: '700', color: TEXT2 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BDR,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT },

  // List
  list: { paddingHorizontal: 20, paddingTop: 4 },
  taskItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BDR, borderLeftWidth: 3,
  },
  taskCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: TEXT3,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  taskBody: { flex: 1, gap: 2 },
  taskCategory: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: TEXT },
  taskTitleDone: { color: TEXT3, textDecorationLine: 'line-through' },
  taskDesc: { fontSize: 12, color: TEXT2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  empty: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  emptyBody: { fontSize: 13, color: TEXT2 },

  // FAB
  fab: {
    position: 'absolute', right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: P, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: P, shadowOpacity: 0.5, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Modal
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 14, borderTopWidth: 1, borderColor: BDR,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: TEXT3, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  input: {
    backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: BDR,
    borderRadius: 12, padding: 13, color: TEXT, fontSize: 14,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: TEXT2, letterSpacing: 0.8, textTransform: 'uppercase' },
  chip: {
    borderWidth: 1, borderColor: BDR, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#0a0a0a',
  },
  chipText: { fontSize: 13, color: TEXT2, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: BDR,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: TEXT2 },
  addBtn: { flex: 2, backgroundColor: P, borderRadius: 12, padding: 14, alignItems: 'center' },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
