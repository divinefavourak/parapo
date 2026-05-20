import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Task, TaskColumn } from '../../features/tasks/types';
import { TaskCard } from './TaskCard';

interface Props {
  title: string;
  column: TaskColumn;
  tasks: Task[];
  count: number;
}

const countBadgeStyles: Record<TaskColumn, { bg: string; border?: string; color: string }> = {
  backlog: { bg: Colors.bgSubtle, color: Colors.textSecondary },
  in_progress: { bg: Colors.overlayBlue, border: Colors.overlayBlueStrong, color: Colors.accentBlue },
  done: { bg: Colors.overlayGreen, border: Colors.overlayGreenStrong, color: Colors.accentGreen },
};

export const KanbanColumn: React.FC<Props> = ({ title, column, tasks, count }) => {
  const badge = countBadgeStyles[column];
  const dimmed = column === 'done';

  return (
    <View style={[styles.column, dimmed && styles.dimmed]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.columnTitle}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border ?? 'transparent', borderWidth: badge.border ? 1 : 0 }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{count}</Text>
          </View>
        </View>
        {column !== 'done' && (
          <Text style={styles.moreIcon}>•••</Text>
        )}
      </View>

      <View style={styles.cards}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: 8,
  },
  dimmed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  columnTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
  moreIcon: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  cards: {
    gap: 16,
  },
});
