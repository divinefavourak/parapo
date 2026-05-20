export type TaskColumn = 'backlog' | 'in_progress' | 'done';
export type TaskCategory = 'Logistics' | 'Finance' | 'Review' | 'Creative' | 'Engagement';

export interface TaskAssignee {
  name: string;
  initials: string;
  avatarColor?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  column: TaskColumn;
  assignee: TaskAssignee;
  progress?: number;
  progressLabel?: string;
  dueLabel?: string;
  dueUrgent?: boolean;
  isAISuggested?: boolean;
  isCompleted?: boolean;
}
