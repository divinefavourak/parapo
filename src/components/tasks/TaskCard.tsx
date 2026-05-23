import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Task, TaskColumn } from '../../features/tasks/types';
import { ProgressBar } from '../ui/ProgressBar';
import { Avatar } from '../ui/Avatar';
import { useTaskStore } from '../../store/taskStore';

interface Props {
  task: Task;
  onPress?: () => void;
}

const categoryColors: Record<string, string> = {
  Logistics: Colors.bgSubtle,
  Finance: '#93000a',
  Review: Colors.bgSubtle,
  Creative: Colors.bgSubtle,
  Engagement: Colors.bgSubtle,
};

const categoryTextColors: Record<string, string> = {
  Finance: Colors.accentRedDeep,
};

const COLUMN_LABELS: Record<TaskColumn, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
};

const COLUMN_ICONS: Record<TaskColumn, string> = {
  backlog: '◦',
  in_progress: '▶',
  done: '✓',
};

const ALL_COLUMNS: TaskColumn[] = ['backlog', 'in_progress', 'done'];

export const TaskCard: React.FC<Props> = ({ task, onPress }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const moveTask = useTaskStore((s) => s.moveTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const catBg = categoryColors[task.category] ?? Colors.bgSubtle;
  const catText = categoryTextColors[task.category] ?? Colors.textSecondary;
  const progressColor = task.dueUrgent ? Colors.accentRed : Colors.accentBlue;

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen((v) => !v);
  };

  const handleMove = (col: TaskColumn) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    moveTask(task.id, col);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteTask(task.id);
    setMenuOpen(false);
  };

  if (task.isAISuggested) {
    return (
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiIcon}>✦</Text>
          <Text style={styles.aiLabel}>AI INSIGHT</Text>
        </View>
        <Text style={styles.aiTitle}>{task.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
        <TouchableOpacity
          style={styles.aiAction}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            moveTask(task.id, 'backlog');
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.aiActionText}>Add to Backlog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (task.isCompleted) {
    return (
      <View style={styles.completedCard}>
        <View style={styles.completedHeader}>
          <Text style={styles.completedIcon}>✓</Text>
          <Text style={styles.completedLabel}>Completed</Text>
        </View>
        <Text style={styles.completedTitle}>{task.title}</Text>
        <Text style={styles.desc}>{task.description}</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          <View style={[styles.categoryTag, { backgroundColor: catBg }]}>
            <Text style={[styles.categoryText, { color: catText }]}>{task.category}</Text>
          </View>
          <TouchableOpacity
            onPress={handleMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.menuBtn}
          >
            <Text style={[styles.moreIcon, menuOpen && styles.moreIconActive]}>⋮</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{task.title}</Text>

        {task.progress !== undefined ? (
          <View style={styles.progressArea}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{task.progressLabel}</Text>
              <Text style={[styles.progressPct, { color: progressColor }]}>
                {Math.round(task.progress * 100)}%
              </Text>
            </View>
            <ProgressBar progress={task.progress} color={progressColor} />
          </View>
        ) : (
          <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
        )}

        <View style={styles.footer}>
          <View style={styles.assignee}>
            <Avatar initials={task.assignee?.initials ?? 'U'} size={24} color={task.assignee?.avatarColor} />
            <Text style={styles.assigneeName}>{task.assignee?.name ?? 'Unassigned'}</Text>
          </View>
          {task.dueLabel && (
            <View style={styles.dueRow}>
              {task.dueUrgent && <Text style={styles.dueIcon}>⚠</Text>}
              <Text style={[styles.dueLabel, task.dueUrgent && styles.dueLabelUrgent]}>
                {task.dueLabel}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Inline action menu */}
      {menuOpen && (
        <View style={styles.actionMenu}>
          {ALL_COLUMNS.filter((col) => col !== task.column).map((col) => (
            <TouchableOpacity
              key={col}
              style={styles.actionItem}
              onPress={() => handleMove(col)}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIcon}>{COLUMN_ICONS[col]}</Text>
              <Text style={styles.actionLabel}>Move to {COLUMN_LABELS[col]}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemDelete]}
            onPress={handleDelete}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionIcon, styles.actionIconDelete]}>✕</Text>
            <Text style={[styles.actionLabel, styles.actionLabelDelete]}>Delete task</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 17,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  categoryText: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
  menuBtn: {
    padding: 2,
  },
  moreIcon: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  moreIconActive: {
    color: Colors.accentBlue,
  },
  title: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  desc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    paddingBottom: 12,
  },
  progressArea: {
    gap: 4,
    paddingBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  progressPct: {
    ...Typography.labelMedium,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: 4,
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeName: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueIcon: {
    fontSize: 10,
    color: Colors.accentRed,
  },
  dueLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  dueLabelUrgent: {
    color: Colors.accentRed,
  },

  // Action menu
  actionMenu: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  actionItemDelete: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    color: Colors.accentBlue,
    fontSize: 13,
    width: 16,
    textAlign: 'center',
  },
  actionIconDelete: {
    color: Colors.accentRed,
  },
  actionLabel: {
    ...Typography.labelLarge,
    color: Colors.textSecondary,
  },
  actionLabelDelete: {
    color: Colors.accentRed,
  },

  // AI card
  aiCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(208,188,255,0.2)',
    borderRadius: 4,
    padding: 17,
    gap: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiIcon: {
    color: Colors.accentPurpleLight,
    fontSize: 11,
  },
  aiLabel: {
    ...Typography.labelMedium,
    color: Colors.accentPurpleLight,
    fontWeight: '700',
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  aiTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  aiAction: {
    borderWidth: 1,
    borderColor: 'rgba(208,188,255,0.3)',
    borderRadius: 2,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  aiActionText: {
    ...Typography.labelMedium,
    color: Colors.accentPurpleLight,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },

  // Completed card
  completedCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderLeftWidth: 2,
    borderColor: Colors.accentGreen,
    borderRadius: 4,
    paddingLeft: 18,
    paddingRight: 17,
    paddingVertical: 17,
    gap: 4,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedIcon: {
    color: Colors.accentGreen,
    fontSize: 11,
  },
  completedLabel: {
    ...Typography.labelMedium,
    color: Colors.accentGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  completedTitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
});
