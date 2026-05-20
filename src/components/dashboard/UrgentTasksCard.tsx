import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { UrgentTask } from '../../features/dashboard/types';
import { Badge } from '../ui/Badge';

interface Props {
  tasks: UrgentTask[];
}

const priorityVariant = {
  'P0': 'blocker',
  'P1': 'info',
  'REVIEW': 'review',
  'ROUTINE': 'routine',
} as const;

export const UrgentTasksCard: React.FC<Props> = ({ tasks }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Urgent Action Required</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {tasks.map((task, index) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskItem, index === tasks.length - 1 && styles.taskItemLast, task.status === 'routine' && styles.taskItemRoutine]}
            activeOpacity={0.7}
          >
            <View style={styles.taskTop}>
              <Badge label={task.priority} variant={priorityVariant[task.priority]} />
              <Text style={styles.timeAgo}>{task.timeAgo}</Text>
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 17,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  moreBtn: {
    padding: 4,
  },
  moreDots: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 2,
  },
  list: {
    gap: 8,
  },
  taskItem: {
    backgroundColor: 'rgba(19,19,19,0.5)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 4,
    padding: 13,
    gap: 4,
  },
  taskItemLast: {},
  taskItemRoutine: {
    opacity: 0.7,
  },
  taskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeAgo: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  taskTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  taskDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
