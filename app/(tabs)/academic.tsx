import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Badge } from '../../src/components/ui/Badge';
import { useAcademicStore } from '../../src/store/academicStore';
import { Assignment, Course } from '../../src/features/academic/types';

const PRIORITY_VARIANT: Record<string, 'blocker' | 'review' | 'neutral'> = {
  high: 'blocker', medium: 'review', low: 'neutral',
};

const COURSE_COLORS = [
  '#adc6ff', '#a078ff', '#4edea3', '#ffb4ab',
  '#ffd166', '#06d6a0', '#118ab2', '#ef476f',
];

// ── Add Course Modal ─────────────────────────────────────────────────────────

function AddCourseModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (payload: any) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState('3');
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const reset = () => { setCode(''); setTitle(''); setInstructor(''); setCredits('3'); setColor(COURSE_COLORS[0]); };

  const handleAdd = async () => {
    if (!code.trim() || !title.trim()) return;
    setSaving(true);
    try {
      await onAdd({ code: code.trim().toUpperCase(), title: title.trim(), instructor: instructor.trim(), credits: parseInt(credits) || 3, color });
      reset();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not add course. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Course</Text>
          <TouchableOpacity onPress={onClose}><X size={20} color={Colors.textMuted} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <ModalField label="Course Code *" value={code} onChangeText={setCode} placeholder="e.g. CSC 401" autoCapitalize="characters" />
          <ModalField label="Course Title *" value={title} onChangeText={setTitle} placeholder="e.g. Advanced Algorithms" />
          <ModalField label="Instructor" value={instructor} onChangeText={setInstructor} placeholder="e.g. Prof. Adeyemi" />
          <ModalField label="Credits" value={credits} onChangeText={setCredits} placeholder="3" keyboardType="numeric" />

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
            style={[styles.modalBtn, (!code.trim() || !title.trim() || saving) && styles.modalBtnDisabled]}
            onPress={handleAdd}
            disabled={!code.trim() || !title.trim() || saving}
          >
            {saving ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={styles.modalBtnText}>Add Course</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Add Assignment Modal ──────────────────────────────────────────────────────

function AddAssignmentModal({ visible, courses, onClose, onAdd }: {
  visible: boolean;
  courses: Course[];
  onClose: () => void;
  onAdd: (payload: any) => Promise<void>;
}) {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [pct, setPct] = useState('10');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (courses.length > 0 && !courseId) setCourseId(courses[0].id); }, [courses]);

  const reset = () => { setTitle(''); setDueDate(''); setPriority('medium'); setPct('10'); };

  const handleAdd = async () => {
    if (!title.trim() || !courseId) return;
    setSaving(true);
    try {
      await onAdd({ course_id: courseId, title: title.trim(), due_date: dueDate || null, priority, percent_of_grade: parseInt(pct) || 10 });
      reset();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not add assignment. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Assignment</Text>
          <TouchableOpacity onPress={onClose}><X size={20} color={Colors.textMuted} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Course *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, courseId === c.id && styles.chipActive]}
                  onPress={() => setCourseId(c.id)}
                >
                  <Text style={[styles.chipText, courseId === c.id && styles.chipTextActive]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ModalField label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Problem Set 3" />
          <ModalField label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="2026-06-01" keyboardType="numeric" />

          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['high', 'medium', 'low'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && styles.chipActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ModalField label="% of Grade" value={pct} onChangeText={setPct} placeholder="10" keyboardType="numeric" />

          <TouchableOpacity
            style={[styles.modalBtn, (!title.trim() || !courseId || saving) && styles.modalBtnDisabled]}
            onPress={handleAdd}
            disabled={!title.trim() || !courseId || saving}
          >
            {saving ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={styles.modalBtnText}>Add Assignment</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ModalField({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GPARing({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <View style={styles.gpaRingWrap}>
      <View style={styles.gpaRing}>
        <Text style={styles.gpaValue}>{(value || 0).toFixed(1)}</Text>
        <Text style={styles.gpaLabel}>GPA</Text>
      </View>
      <ProgressBar progress={pct} color={Colors.accentBlue} height={3} style={styles.gpaBar} />
      <Text style={styles.gpaTarget}>Target: {(target || 0).toFixed(1)}</Text>
    </View>
  );
}

function CourseCard({ course, onDelete }: { course: Course; onDelete: () => void }) {
  const color = course.color ?? '#4d8eff';
  return (
    <View style={styles.courseCard}>
      <View style={[styles.courseAccent, { backgroundColor: color + '33' }]}>
        <Text style={[styles.courseCode, { color }]}>{course.code}</Text>
      </View>
      <View style={styles.courseBody}>
        <View style={styles.courseTop}>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
          <View style={[styles.gradeChip, { borderColor: color + '55' }]}>
            <Text style={[styles.gradeText, { color }]}>{course.currentGrade ?? 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.courseInstructor}>
          {course.instructor ? `${course.instructor} · ` : ''}{course.credits} credits
        </Text>
        <ProgressBar progress={course.progress ?? 0} color={color} height={3} style={styles.courseProgress} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.courseProgressLabel}>
            {Math.round((course.progress ?? 0) * 100)}% · {(course.gradePoint ?? 0).toFixed(1)} pts
          </Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={13} color={Colors.textDisabled} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AssignmentRow({ item, onSubmit }: { item: Assignment; onSubmit: () => void }) {
  const isSubmitted = item.status === 'submitted' || item.status === 'graded';
  return (
    <TouchableOpacity
      style={[styles.assignmentRow, isSubmitted && styles.assignmentRowDone]}
      onPress={!isSubmitted ? onSubmit : undefined}
      activeOpacity={0.8}
    >
      <View style={styles.assignmentLeft}>
        <View style={[styles.assignmentDot, isSubmitted && styles.assignmentDotDone]} />
        <View style={styles.assignmentInfo}>
          <Text style={[styles.assignmentTitle, isSubmitted && styles.assignmentTitleDone]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.assignmentMeta}>{item.courseCode} · {item.dueTimeLabel ?? ''}</Text>
        </View>
      </View>
      <View style={styles.assignmentRight}>
        {!isSubmitted ? (
          <Badge label={item.priority?.toUpperCase() ?? 'LOW'} variant={PRIORITY_VARIANT[item.priority ?? 'low']} />
        ) : (
          <Text style={styles.submittedLabel}>✓ Done</Text>
        )}
        <Text style={styles.assignmentWeight}>{item.percentOfGrade ?? 0}%</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

type SheetType = 'course' | 'assignment' | null;

export default function AcademicScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, fetchData, submitAssignment, addCourse, addAssignment, deleteCourse } = useAcademicStore();
  const { stats, courses, assignments, studyGoals, semesterLabel } = data;
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [sheet, setSheet] = useState<SheetType>(null);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const visibleCourses = showAllCourses ? courses : courses.slice(0, 3);
  const pendingAssignments = assignments.filter((a) => a.status === 'pending' || a.status === 'overdue');
  const doneAssignments = assignments.filter((a) => a.status === 'submitted' || a.status === 'graded');
  const totalAssignments = stats?.totalAssignments ?? 0;
  const completedAssignments = stats?.completedAssignments ?? 0;
  const assignmentProgress = totalAssignments > 0 ? completedAssignments / totalAssignments : 0;

  return (
    <View style={styles.container}>
      <TopBar
        title="Academic Hub"
        subtitle={semesterLabel ?? 'This Semester'}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddMenuVisible(true); }}
          >
            <Plus size={18} color={Colors.accentBlue} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      {/* Add menu sheet */}
      <Modal visible={addMenuVisible} transparent animationType="fade" onRequestClose={() => setAddMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setAddMenuVisible(false)} activeOpacity={1}>
          <View style={[styles.menuSheet, { bottom: insets.bottom + 80 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setAddMenuVisible(false); setSheet('course'); }}>
              <BookOpen size={16} color={Colors.accentBlue} />
              <Text style={styles.menuItemText}>Add Course</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setAddMenuVisible(false); setSheet('assignment'); }}>
              <Plus size={16} color={Colors.accentPurpleLight} />
              <Text style={styles.menuItemText}>Add Assignment</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AddCourseModal
        visible={sheet === 'course'}
        onClose={() => setSheet(null)}
        onAdd={addCourse}
      />
      <AddAssignmentModal
        visible={sheet === 'assignment'}
        courses={courses}
        onClose={() => setSheet(null)}
        onAdd={addAssignment}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 24, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && courses.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.accentBlue} />
          </View>
        ) : (
          <>
            {/* Semester overview */}
            <View style={styles.overviewCard}>
              <GPARing value={stats?.currentGPA ?? 0} target={stats?.targetGPA ?? 4.5} />
              <View style={styles.overviewStats}>
                <StatBox label={`Credits\nDone`} value={stats?.creditsCompleted ?? 0} />
                <View style={styles.overviewDivider} />
                <StatBox label={`Credits\nEnrolled`} value={stats?.creditsEnrolled ?? 0} />
                <View style={styles.overviewDivider} />
                <StatBox label={`Study Hrs\nThis Week`} value={`${stats?.studyHoursThisWeek ?? 0}h`} color={Colors.accentGreen} />
              </View>
            </View>

            {/* Assignment progress */}
            <View style={styles.progressBanner}>
              <View style={styles.progressBannerTop}>
                <Text style={styles.progressBannerTitle}>Assignment Progress</Text>
                <Text style={styles.progressBannerCount}>{completedAssignments}/{totalAssignments} complete</Text>
              </View>
              <ProgressBar progress={assignmentProgress} color={Colors.accentGreen} height={6} />
            </View>

            {/* Courses */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Courses</Text>
                {courses.length > 3 && (
                  <TouchableOpacity onPress={() => setShowAllCourses((v) => !v)}>
                    <Text style={styles.seeAll}>{showAllCourses ? 'Show less' : `See all ${courses.length}`}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {courses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No courses yet — tap + to add one</Text>
                </View>
              ) : (
                <View style={styles.courseList}>
                  {visibleCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onDelete={() => deleteCourse(course.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Upcoming assignments */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>{pendingAssignments.length} PENDING</Text>
                </View>
              </View>
              {pendingAssignments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No pending assignments</Text>
                </View>
              ) : (
                <View style={styles.assignmentList}>
                  {pendingAssignments.map((item) => (
                    <AssignmentRow key={item.id} item={item} onSubmit={() => submitAssignment(item.id)} />
                  ))}
                </View>
              )}
              {doneAssignments.length > 0 && (
                <>
                  <Text style={styles.completedHeader}>Completed</Text>
                  <View style={[styles.assignmentList, { opacity: 0.65 }]}>
                    {doneAssignments.map((item) => (
                      <AssignmentRow key={item.id} item={item} onSubmit={() => {}} />
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Study goals */}
            {studyGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Study Goals · This Week</Text>
                <View style={styles.goalList}>
                  {studyGoals.map((goal) => {
                    const pct = goal.targetHours > 0 ? Math.min(goal.completedHours / goal.targetHours, 1) : 0;
                    const done = goal.completedHours >= goal.targetHours;
                    return (
                      <View key={goal.id} style={styles.goalRow}>
                        <View style={styles.goalLeft}>
                          <Text style={[styles.goalLabel, done && styles.goalLabelDone]}>{goal.label}</Text>
                          <Text style={styles.goalHours}>{goal.completedHours}h / {goal.targetHours}h</Text>
                        </View>
                        <View style={styles.goalRight}>
                          <ProgressBar progress={pct} color={done ? Colors.accentGreen : Colors.accentBlue} height={4} style={styles.goalBar} />
                          {done && <Text style={styles.goalDoneIcon}>✓</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={styles.overviewStat}>
      <Text style={[styles.overviewStatValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.overviewStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 20 },
  addBtn: { padding: 6 },

  // Overview
  overviewCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20,
  },
  gpaRingWrap: { alignItems: 'center', gap: 6 },
  gpaRing: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 5,
    borderColor: Colors.accentBlueDark, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgSurface,
  },
  gpaValue: { fontSize: 22, fontWeight: '700', color: Colors.accentBlue, letterSpacing: -0.5 },
  gpaLabel: { ...Typography.labelSmall, color: Colors.textMuted, marginTop: 1 },
  gpaBar: { width: 84 },
  gpaTarget: { ...Typography.labelSmall, color: Colors.textDisabled },
  overviewStats: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overviewStat: { alignItems: 'center', flex: 1, gap: 4 },
  overviewStatValue: { fontSize: 20, fontWeight: '700', color: Colors.accentBlue },
  overviewStatLabel: { ...Typography.labelSmall, color: Colors.textMuted, textAlign: 'center' },
  overviewDivider: { width: 1, height: 36, backgroundColor: Colors.borderSubtle },

  // Progress banner
  progressBanner: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 16, gap: 10,
  },
  progressBannerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressBannerTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '600' },
  progressBannerCount: { ...Typography.labelMedium, color: Colors.accentGreen, fontWeight: '600' },

  // Sections
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  seeAll: { ...Typography.labelMedium, color: Colors.accentBlue },
  emptyCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 20, alignItems: 'center',
  },
  emptyCardText: { ...Typography.bodySmall, color: Colors.textMuted },
  urgentBadge: {
    backgroundColor: Colors.overlayRed, borderWidth: 1, borderColor: Colors.overlayRedStrong,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  urgentBadgeText: { ...Typography.labelSmall, color: Colors.accentRed, fontWeight: '700', letterSpacing: 0.8 },

  // Courses
  courseList: { gap: 10 },
  courseCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, overflow: 'hidden', flexDirection: 'row',
  },
  courseAccent: { width: 64, alignItems: 'center', justifyContent: 'center', padding: 10 },
  courseCode: { ...Typography.labelSmall, fontWeight: '700', textAlign: 'center', letterSpacing: 0.4 },
  courseBody: { flex: 1, padding: 14, gap: 4 },
  courseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  courseTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  gradeChip: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  gradeText: { ...Typography.labelSmall, fontWeight: '700' },
  courseInstructor: { ...Typography.bodySmall, color: Colors.textMuted },
  courseProgress: { marginTop: 4 },
  courseProgressLabel: { ...Typography.labelSmall, color: Colors.textDisabled, marginTop: 2 },

  // Assignments
  assignmentList: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, overflow: 'hidden',
  },
  assignmentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: 12,
  },
  assignmentRowDone: { opacity: 0.7 },
  assignmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  assignmentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentRed, flexShrink: 0 },
  assignmentDotDone: { backgroundColor: Colors.accentGreen },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '500' },
  assignmentTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  assignmentMeta: { ...Typography.labelSmall, color: Colors.textMuted, marginTop: 2 },
  assignmentRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  assignmentWeight: { ...Typography.labelSmall, color: Colors.textDisabled },
  submittedLabel: { ...Typography.labelSmall, color: Colors.accentGreen, fontWeight: '600' },
  completedHeader: {
    ...Typography.labelUppercase, color: Colors.textDisabled,
    letterSpacing: 1, paddingHorizontal: 4, marginTop: 4,
  },

  // Goals
  goalList: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, overflow: 'hidden',
  },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  goalLeft: { flex: 1, gap: 2 },
  goalLabel: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '500' },
  goalLabelDone: { color: Colors.accentGreen },
  goalHours: { ...Typography.labelSmall, color: Colors.textMuted },
  goalRight: { width: 100, flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalBar: { flex: 1 },
  goalDoneIcon: { color: Colors.accentGreen, fontSize: 12, fontWeight: '700' },

  // Modal
  modalRoot: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '700' },
  modalBody: { padding: 20, gap: 4 },
  fieldLabel: { ...Typography.labelMedium, color: Colors.textMuted, fontWeight: '600', marginBottom: 6 },
  fieldInput: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: 14,
  },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary },
  chip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.bgElevated,
  },
  chipActive: { backgroundColor: Colors.overlayBlue, borderColor: Colors.accentBlue },
  chipText: { ...Typography.labelMedium, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: Colors.accentBlue, fontWeight: '700' },
  modalBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: 8,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  modalBtnDisabled: { backgroundColor: Colors.bgSubtle },
  modalBtnText: { ...Typography.labelLarge, color: Colors.bg, fontWeight: '700' },

  // Add menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: {
    position: 'absolute', right: 20,
    backgroundColor: Colors.bgElevated, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', minWidth: 200,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  menuItemText: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: Colors.border },
});
