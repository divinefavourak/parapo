import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, BookOpen, ChevronRight, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useAcademicStore } from '../../src/store/academicStore';
import { Assignment, Course } from '../../src/features/academic/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#7C5CFC';
const P_DIM  = 'rgba(124,92,252,0.15)';
const CARD   = '#13131F';
const BDR    = 'rgba(255,255,255,0.07)';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8B8BAA';
const TEXT3  = '#3D3D5C';
const GREEN  = '#4ADE80';
const RED    = '#F87171';

const COURSE_COLORS = [
  '#60A5FA', '#A78BFA', '#34D399', '#F87171',
  '#FBBF24', '#06B6D4', '#FB923C', '#F472B6',
];

// ── Mini circular ring ────────────────────────────────────────────────────────
function MiniRing({ pct, size = 56, stroke = 5, color = P }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size/2} cy={size/2} r={r} stroke={BDR} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size/2} cy={size/2} r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${Math.max(0.01, pct) * c} ${c}`}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── GPA Ring ──────────────────────────────────────────────────────────────────
function GPARing({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const size = 88, stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.gpaWrap}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={BDR} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size/2} cy={size/2} r={r}
          stroke={P}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${Math.max(0.01, pct) * c} ${c}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.gpaInner}>
        <Text style={styles.gpaValue}>{(value || 0).toFixed(1)}</Text>
        <Text style={styles.gpaLabel}>GPA</Text>
      </View>
    </View>
  );
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onDelete }: { course: Course; onDelete: () => void }) {
  const color = course.color ?? P;
  const pct   = Math.round((course.progress ?? 0) * 100);
  return (
    <View style={[styles.courseCard, { borderLeftColor: color }]}>
      <View style={styles.courseLeft}>
        <View style={[styles.courseCodeBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.courseCode, { color }]}>{course.code}</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
          <Text style={styles.courseInstructor}>
            {course.instructor ? `${course.instructor} · ` : ''}{course.credits} cr
          </Text>
        </View>
      </View>
      <View style={styles.courseRight}>
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <MiniRing pct={course.progress ?? 0} size={52} stroke={4} color={color} />
          <View style={styles.miniPctWrap}>
            <Text style={[styles.miniPct, { color }]}>{pct}%</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={13} color={TEXT3} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Assignment row ────────────────────────────────────────────────────────────
function AssignmentRow({ item, onSubmit }: { item: Assignment; onSubmit: () => void }) {
  const done = item.status === 'submitted' || item.status === 'graded';
  const priorityColor = item.priority === 'high' ? RED : item.priority === 'medium' ? '#FBBF24' : TEXT3;
  return (
    <TouchableOpacity
      style={[styles.assignRow, done && { opacity: 0.55 }]}
      onPress={!done ? onSubmit : undefined}
      activeOpacity={0.8}
    >
      <View style={[styles.assignDot, { backgroundColor: done ? GREEN : priorityColor }]} />
      <View style={styles.assignInfo}>
        <Text style={[styles.assignTitle, done && { textDecorationLine: 'line-through', color: TEXT3 }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.assignMeta}>{item.courseCode}{item.dueTimeLabel ? ` · ${item.dueTimeLabel}` : ''}</Text>
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
        <Text style={[styles.priorityText, { color: done ? GREEN : priorityColor }]}>
          {done ? '✓ Done' : (item.priority ?? 'low').toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Modal field ───────────────────────────────────────────────────────────────
function Field({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.fieldInput} placeholderTextColor={TEXT3} {...props} />
    </View>
  );
}

// ── Add Course Modal ──────────────────────────────────────────────────────────
function AddCourseModal({ visible, onClose, onAdd }: {
  visible: boolean; onClose: () => void; onAdd: (p: any) => Promise<void>;
}) {
  const [code, setCode]       = useState('');
  const [title, setTitle]     = useState('');
  const [instr, setInstr]     = useState('');
  const [credits, setCredits] = useState('3');
  const [color, setColor]     = useState(COURSE_COLORS[0]);
  const [saving, setSaving]   = useState(false);

  const submit = async () => {
    if (!code.trim() || !title.trim()) return;
    setSaving(true);
    try {
      await onAdd({ code: code.trim().toUpperCase(), title: title.trim(), instructor: instr.trim(), credits: parseInt(credits) || 3, color });
      setCode(''); setTitle(''); setInstr(''); setCredits('3'); setColor(COURSE_COLORS[0]);
      onClose();
    } catch { Alert.alert('Error', 'Could not add course.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Course</Text>
          <TouchableOpacity onPress={onClose}><X size={20} color={TEXT2} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Field label="Course Code *" value={code} onChangeText={setCode} placeholder="e.g. CSC 401" autoCapitalize="characters" />
          <Field label="Course Title *" value={title} onChangeText={setTitle} placeholder="e.g. Advanced Algorithms" />
          <Field label="Instructor" value={instr} onChangeText={setInstr} placeholder="e.g. Prof. Adeyemi" />
          <Field label="Credits" value={credits} onChangeText={setCredits} placeholder="3" keyboardType="numeric" />
          <Text style={styles.fieldLabel}>Color</Text>
          <View style={styles.colorRow}>
            {COURSE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.modalBtn, (!code.trim() || !title.trim() || saving) && { opacity: 0.4 }]}
            onPress={submit}
            disabled={!code.trim() || !title.trim() || saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Add Course</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Add Assignment Modal ──────────────────────────────────────────────────────
function AddAssignmentModal({ visible, courses, onClose, onAdd }: {
  visible: boolean; courses: Course[]; onClose: () => void; onAdd: (p: any) => Promise<void>;
}) {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle]       = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [priority, setPriority] = useState<'high'|'medium'|'low'>('medium');
  const [pct, setPct]           = useState('10');
  const [saving, setSaving]     = useState(false);

  useEffect(() => { if (courses.length > 0 && !courseId) setCourseId(courses[0].id); }, [courses]);

  const submit = async () => {
    if (!title.trim() || !courseId) return;
    setSaving(true);
    try {
      await onAdd({ course_id: courseId, title: title.trim(), due_date: dueDate || null, priority, percent_of_grade: parseInt(pct) || 10 });
      setTitle(''); setDueDate(''); setPriority('medium'); setPct('10');
      onClose();
    } catch { Alert.alert('Error', 'Could not add assignment.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Assignment</Text>
          <TouchableOpacity onPress={onClose}><X size={20} color={TEXT2} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Course *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, courseId === c.id && { backgroundColor: P_DIM, borderColor: P }]}
                  onPress={() => setCourseId(c.id)}
                >
                  <Text style={[styles.chipText, courseId === c.id && { color: P, fontWeight: '700' }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Problem Set 3" />
          <Field label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="2026-06-01" keyboardType="numeric" />
          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['high', 'medium', 'low'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && { backgroundColor: P_DIM, borderColor: P }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.chipText, priority === p && { color: P, fontWeight: '700' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Field label="% of Grade" value={pct} onChangeText={setPct} placeholder="10" keyboardType="numeric" />
          <TouchableOpacity
            style={[styles.modalBtn, (!title.trim() || !courseId || saving) && { opacity: 0.4 }]}
            onPress={submit}
            disabled={!title.trim() || !courseId || saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Add Assignment</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
type SheetType = 'course' | 'assignment' | null;

export default function AcademicScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, fetchData, submitAssignment, addCourse, addAssignment, deleteCourse } = useAcademicStore();
  const { stats, courses, assignments, semesterLabel } = data;

  const [showAll, setShowAll] = useState(false);
  const [sheet, setSheet]     = useState<SheetType>(null);
  const [menu, setMenu]       = useState(false);

  useEffect(() => { fetchData(); }, []);

  const visible = showAll ? courses : courses.slice(0, 3);
  const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'overdue');
  const done    = assignments.filter((a) => a.status === 'submitted' || a.status === 'graded');
  const total   = stats?.totalAssignments ?? 0;
  const complet = stats?.completedAssignments ?? 0;

  return (
    <View style={styles.root}>
      {/* Add menu overlay */}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenu(false)} activeOpacity={1}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenu(false); setSheet('course'); }}>
              <BookOpen size={16} color={P} strokeWidth={1.8} />
              <Text style={styles.menuText}>Add Course</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: BDR }} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenu(false); setSheet('assignment'); }}>
              <Plus size={16} color="#A78BFA" strokeWidth={2} />
              <Text style={styles.menuText}>Add Assignment</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AddCourseModal visible={sheet === 'course'} onClose={() => setSheet(null)} onAdd={addCourse} />
      <AddAssignmentModal visible={sheet === 'assignment'} courses={courses} onClose={() => setSheet(null)} onAdd={addAssignment} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Academic Hub</Text>
            <Text style={styles.headerSub}>{semesterLabel ?? 'This Semester'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMenu(true); }}
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {isLoading && courses.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={P} />
          </View>
        ) : (
          <>
            {/* ── Semester overview card ── */}
            <View style={styles.overviewCard}>
              <View style={styles.gpaSection}>
                <GPARing value={stats?.currentGPA ?? 0} target={stats?.targetGPA ?? 4.5} />
                <Text style={styles.gpaTarget}>Target: {(stats?.targetGPA ?? 4.5).toFixed(1)}</Text>
              </View>
              <View style={styles.statsCol}>
                <StatBox label="Credits Done" value={stats?.creditsCompleted ?? 0} color={P} />
                <View style={{ height: 1, backgroundColor: BDR }} />
                <StatBox label="Enrolled" value={stats?.creditsEnrolled ?? 0} color={TEXT2} />
                <View style={{ height: 1, backgroundColor: BDR }} />
                <StatBox label="Study Hrs" value={`${stats?.studyHoursThisWeek ?? 0}h`} color="#4ADE80" />
              </View>
            </View>

            {/* ── Assignment progress banner ── */}
            {total > 0 && (
              <View style={styles.progressBanner}>
                <View style={styles.progressBannerTop}>
                  <View style={styles.progressIcon}>
                    <TrendingUp size={14} color={GREEN} strokeWidth={2} />
                  </View>
                  <Text style={styles.progressBannerTitle}>Assignment Progress</Text>
                  <Text style={[styles.progressBannerCount, { color: GREEN }]}>{complet}/{total}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(complet / total) * 100}%`, backgroundColor: GREEN }]} />
                </View>
              </View>
            )}

            {/* ── Courses ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Courses</Text>
                {courses.length > 3 && (
                  <TouchableOpacity onPress={() => setShowAll((v) => !v)}>
                    <Text style={styles.seeAll}>{showAll ? 'Show less' : `See all ${courses.length}`}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {courses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={24} color={TEXT3} strokeWidth={1.5} />
                  <Text style={styles.emptyText}>No courses yet — tap + to add one</Text>
                </View>
              ) : (
                visible.map((c) => (
                  <CourseCard key={c.id} course={c} onDelete={() => deleteCourse(c.id)} />
                ))
              )}
            </View>

            {/* ── Assignments ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {pending.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: RED + '20' }]}>
                    <Text style={[styles.badgeText, { color: RED }]}>{pending.length} PENDING</Text>
                  </View>
                )}
              </View>
              {pending.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No pending assignments</Text>
                </View>
              ) : (
                <View style={styles.assignList}>
                  {pending.map((a) => (
                    <AssignmentRow key={a.id} item={a} onSubmit={() => submitAssignment(a.id)} />
                  ))}
                </View>
              )}
              {done.length > 0 && (
                <View style={[styles.assignList, { opacity: 0.6, marginTop: 10 }]}>
                  {done.map((a) => (
                    <AssignmentRow key={a.id} item={a} onSubmit={() => {}} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ padding: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: TEXT2, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 20, gap: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: TEXT2, marginTop: 2 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: P, alignItems: 'center', justifyContent: 'center',
  },

  // Overview
  overviewCard: {
    backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BDR,
    flexDirection: 'row', padding: 20, gap: 16, alignItems: 'center',
  },
  gpaSection: { alignItems: 'center', gap: 6 },
  gpaWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  gpaInner: { position: 'absolute', alignItems: 'center' },
  gpaValue: { fontSize: 20, fontWeight: '700', color: P },
  gpaLabel: { fontSize: 10, color: TEXT2, fontWeight: '600' },
  gpaTarget: { fontSize: 10, color: TEXT3 },
  statsCol: {
    flex: 1, backgroundColor: '#0a0a0a', borderRadius: 14,
    borderWidth: 1, borderColor: BDR, overflow: 'hidden',
  },

  // Progress banner
  progressBanner: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BDR, padding: 14, gap: 10,
  },
  progressBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressIcon: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: GREEN + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  progressBannerTitle: { fontSize: 14, fontWeight: '600', color: TEXT, flex: 1 },
  progressBannerCount: { fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 6, backgroundColor: BDR, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  seeAll: { fontSize: 13, color: P, fontWeight: '500' },
  emptyCard: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BDR,
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 13, color: TEXT2 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },

  // Courses
  courseCard: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BDR,
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderLeftWidth: 3,
  },
  courseLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  courseCodeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' },
  courseCode: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 14, fontWeight: '600', color: TEXT },
  courseInstructor: { fontSize: 11, color: TEXT2, marginTop: 2 },
  courseRight: { alignItems: 'center', gap: 6 },
  miniPctWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  miniPct: { fontSize: 10, fontWeight: '700' },

  // Assignments
  assignList: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BDR, overflow: 'hidden',
  },
  assignRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: BDR,
  },
  assignDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  assignInfo: { flex: 1 },
  assignTitle: { fontSize: 14, fontWeight: '600', color: TEXT },
  assignMeta: { fontSize: 11, color: TEXT2, marginTop: 2 },
  priorityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priorityText: { fontSize: 10, fontWeight: '700' },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: BDR,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: TEXT },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: TEXT2, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  fieldInput: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: TEXT, fontSize: 14,
  },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: TEXT },
  chip: {
    borderWidth: 1, borderColor: BDR, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: CARD,
  },
  chipText: { fontSize: 13, color: TEXT2, fontWeight: '500' },
  modalBtn: { backgroundColor: P, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 20 },
  menuSheet: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BDR, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuText: { fontSize: 15, fontWeight: '500', color: TEXT },
});
