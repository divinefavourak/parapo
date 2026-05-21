import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Badge } from '../../src/components/ui/Badge';
import { Assignment, Course } from '../../src/features/academic/types';
import { useAcademicStore } from '../../src/store/academicStore';

const PRIORITY_VARIANT: Record<string, 'blocker' | 'review' | 'neutral'> = {
  high: 'blocker',
  medium: 'review',
  low: 'neutral',
};

function GPARing({ value, target }: { value: number; target: number }) {
  const pct = Math.min(value / target, 1);
  return (
    <View style={styles.gpaRingWrap}>
      <View style={styles.gpaRing}>
        <Text style={styles.gpaValue}>{value.toFixed(1)}</Text>
        <Text style={styles.gpaLabel}>GPA</Text>
      </View>
      <ProgressBar progress={pct} color={Colors.accentBlue} height={3} style={styles.gpaBar} />
      <Text style={styles.gpaTarget}>Target: {target.toFixed(1)}</Text>
    </View>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <TouchableOpacity style={styles.courseCard} activeOpacity={0.8}>
      <View style={[styles.courseAccent, { backgroundColor: course.color + '33' }]}>
        <Text style={[styles.courseCode, { color: course.color }]}>{course.code}</Text>
      </View>
      <View style={styles.courseBody}>
        <View style={styles.courseTop}>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
          <View style={[styles.gradeChip, { borderColor: course.color + '55' }]}>
            <Text style={[styles.gradeText, { color: course.color }]}>{course.currentGrade}</Text>
          </View>
        </View>
        <Text style={styles.courseInstructor}>{course.instructor} · {course.credits} credits</Text>
        <ProgressBar progress={course.progress} color={course.color} height={3} style={styles.courseProgress} />
        <Text style={styles.courseProgressLabel}>{Math.round(course.progress * 100)}% coverage · {course.gradePoint.toFixed(1)} pts</Text>
      </View>
    </TouchableOpacity>
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
          <Text
            style={[styles.assignmentTitle, isSubmitted && styles.assignmentTitleDone]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.assignmentMeta}>{item.courseCode} · {item.dueTimeLabel}</Text>
        </View>
      </View>
      <View style={styles.assignmentRight}>
        {!isSubmitted && (
          <Badge label={item.priority.toUpperCase()} variant={PRIORITY_VARIANT[item.priority]} />
        )}
        {isSubmitted && (
          <Text style={styles.submittedLabel}>✓ Done</Text>
        )}
        <Text style={styles.assignmentWeight}>{item.percentOfGrade}%</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AcademicScreen() {
  const insets = useSafeAreaInsets();
  const { data, fetchData, submitAssignment } = useAcademicStore();
  const { stats, courses, assignments, studyGoals, semesterLabel } = data;
  const [showAllCourses, setShowAllCourses] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const visibleCourses = showAllCourses ? courses : courses.slice(0, 3);
  const pendingAssignments = assignments.filter((a) => a.status === 'pending');
  const doneAssignments = assignments.filter((a) => a.status === 'submitted' || a.status === 'graded');
  const assignmentProgress = stats.completedAssignments / stats.totalAssignments;

  return (
    <View style={styles.container}>
      <TopBar title="Academic Hub" subtitle={semesterLabel} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Layout.headerHeight + insets.top + 24, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Semester overview */}
        <View style={styles.overviewCard}>
          <GPARing value={stats.currentGPA} target={stats.targetGPA} />
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{stats.creditsCompleted}</Text>
              <Text style={styles.overviewStatLabel}>Credits{'\n'}Done</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{stats.creditsEnrolled}</Text>
              <Text style={styles.overviewStatLabel}>Credits{'\n'}Enrolled</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: Colors.accentGreen }]}>
                {stats.studyHoursThisWeek}h
              </Text>
              <Text style={styles.overviewStatLabel}>Study Hrs{'\n'}This Week</Text>
            </View>
          </View>
        </View>

        {/* Assignment progress banner */}
        <View style={styles.progressBanner}>
          <View style={styles.progressBannerTop}>
            <Text style={styles.progressBannerTitle}>Assignment Progress</Text>
            <Text style={styles.progressBannerCount}>
              {stats.completedAssignments}/{stats.totalAssignments} complete
            </Text>
          </View>
          <ProgressBar
            progress={assignmentProgress}
            color={Colors.accentGreen}
            height={6}
          />
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses</Text>
            <TouchableOpacity onPress={() => setShowAllCourses((v) => !v)}>
              <Text style={styles.seeAll}>
                {showAllCourses ? 'Show less' : `See all ${courses.length}`}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.courseList}>
            {visibleCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </View>
        </View>

        {/* Upcoming assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>{pendingAssignments.length} PENDING</Text>
            </View>
          </View>
          <View style={styles.assignmentList}>
            {pendingAssignments.map((item) => (
              <AssignmentRow key={item.id} item={item} onSubmit={() => submitAssignment(item.id)} />
            ))}
          </View>
          {doneAssignments.length > 0 && (
            <>
              <Text style={styles.completedHeader}>Completed</Text>
              <View style={[styles.assignmentList, styles.doneList]}>
                {doneAssignments.map((item) => (
                  <AssignmentRow key={item.id} item={item} onSubmit={() => {}} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Study goals this week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Goals · This Week</Text>
          <View style={styles.goalList}>
            {studyGoals.map((goal) => {
              const pct = Math.min(goal.completedHours / goal.targetHours, 1);
              const done = goal.completedHours >= goal.targetHours;
              return (
                <View key={goal.id} style={styles.goalRow}>
                  <View style={styles.goalLeft}>
                    <Text style={[styles.goalLabel, done && styles.goalLabelDone]}>{goal.label}</Text>
                    <Text style={styles.goalHours}>
                      {goal.completedHours}h / {goal.targetHours}h
                    </Text>
                  </View>
                  <View style={styles.goalRight}>
                    <ProgressBar
                      progress={pct}
                      color={done ? Colors.accentGreen : Colors.accentBlue}
                      height={4}
                      style={styles.goalBar}
                    />
                    {done && <Text style={styles.goalDoneIcon}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI insight */}
        <View style={styles.aiInsight}>
          <Text style={styles.aiInsightIcon}>✦</Text>
          <Text style={styles.aiInsightText}>
            You're 0.3 points below your GPA target. Prioritizing the CSC 401 problem set tomorrow
            could add up to 0.15 grade points to your semester average.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, gap: 20 },

  overviewCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  gpaRingWrap: {
    alignItems: 'center',
    gap: 6,
  },
  gpaRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: Colors.accentBlueDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSurface,
  },
  gpaValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accentBlue,
    letterSpacing: -0.5,
  },
  gpaLabel: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    marginTop: 1,
  },
  gpaBar: { width: 84 },
  gpaTarget: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
  },

  overviewStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewStat: { alignItems: 'center', flex: 1, gap: 4 },
  overviewStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accentBlue,
  },
  overviewStatLabel: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderSubtle,
  },

  progressBanner: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  progressBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBannerTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  progressBannerCount: {
    ...Typography.labelMedium,
    color: Colors.accentGreen,
    fontWeight: '600',
  },

  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  seeAll: {
    ...Typography.labelMedium,
    color: Colors.accentBlue,
  },
  urgentBadge: {
    backgroundColor: Colors.overlayRed,
    borderWidth: 1,
    borderColor: Colors.overlayRedStrong,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentBadgeText: {
    ...Typography.labelSmall,
    color: Colors.accentRed,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  courseList: { gap: 10 },
  courseCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  courseAccent: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  courseCode: {
    ...Typography.labelSmall,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  courseBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  courseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  courseTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  gradeChip: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  gradeText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  courseInstructor: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  courseProgress: { marginTop: 4 },
  courseProgressLabel: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
    marginTop: 2,
  },

  assignmentList: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  doneList: {
    opacity: 0.65,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  assignmentRowDone: {
    opacity: 0.7,
  },
  assignmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  assignmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentRed,
    flexShrink: 0,
  },
  assignmentDotDone: {
    backgroundColor: Colors.accentGreen,
  },
  assignmentInfo: { flex: 1 },
  assignmentTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  assignmentTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  assignmentMeta: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  assignmentRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  assignmentWeight: {
    ...Typography.labelSmall,
    color: Colors.textDisabled,
  },
  submittedLabel: {
    ...Typography.labelSmall,
    color: Colors.accentGreen,
    fontWeight: '600',
  },
  completedHeader: {
    ...Typography.labelUppercase,
    color: Colors.textDisabled,
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  goalList: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  goalLeft: { flex: 1, gap: 2 },
  goalLabel: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  goalLabelDone: { color: Colors.accentGreen },
  goalHours: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
  },
  goalRight: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalBar: { flex: 1 },
  goalDoneIcon: {
    color: Colors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
  },

  aiInsight: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(208,188,255,0.2)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
  },
  aiInsightIcon: {
    color: Colors.accentPurpleLight,
    fontSize: 14,
    marginTop: 2,
  },
  aiInsightText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
