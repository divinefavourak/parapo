export type Priority = 'P0' | 'P1' | 'REVIEW' | 'ROUTINE';
export type TaskStatus = 'blocker' | 'review' | 'routine';

export interface UrgentTask {
  id: string;
  priority: Priority;
  title: string;
  description: string;
  timeAgo: string;
  status: TaskStatus;
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  minutesUntil: number;
}

export interface FocusSession {
  title: string;
  subtitle: string;
  progress: number;
  estimatedFinish: string;
  collaborators: { initials: string }[];
  timeRemaining: string;
}

export interface AIBriefing {
  summary: string;
  tags: { label: string; type: 'warning' | 'success' | 'info' }[];
}

export interface DashboardData {
  greeting: string;
  productivityScore: number;
  productivityDelta: string;
  aiBriefing: AIBriefing;
  focusSession: FocusSession;
  urgentTasks: UrgentTask[];
  nextMeeting: Meeting;
}
