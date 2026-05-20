export type DelegationStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
export type MeetingStatus = 'upcoming' | 'live' | 'done';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  isOnline: boolean;
  currentActivity?: string;
}

export interface DelegationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  status: DelegationStatus;
  progress?: number;
}

export interface OrgNode {
  id: string;
  name: string;
  children?: string[];
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  location?: string;
  attendeeCount: number;
  status: MeetingStatus;
  minutesUntil?: number;
}

export interface ProjectMilestone {
  date: string;
  month: string;
  label: string;
  sublabel: string;
  isCurrent?: boolean;
  isComplete?: boolean;
}
