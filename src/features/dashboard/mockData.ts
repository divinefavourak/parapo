import { DashboardData } from './types';

export const mockDashboardData: DashboardData = {
  greeting: 'Good morning, Commander',
  productivityScore: 84,
  productivityDelta: '+4% vs last week',
  aiBriefing: {
    summary: '3 meetings, 2 deadlines,\nand 14 delegated tasks\nneeding review.',
    tags: [
      { label: 'Deadlines critical', type: 'warning' },
      { label: 'Team capacity optimal', type: 'success' },
    ],
  },
  focusSession: {
    title: "Q3 Strategic Review & Alignment",
    subtitle: 'Active Deep Work Session',
    progress: 0.65,
    estimatedFinish: '14:30',
    collaborators: [{ initials: 'SJ' }, { initials: 'MK' }],
    timeRemaining: '2h 45m',
  },
  urgentTasks: [
    {
      id: '1',
      priority: 'P0',
      title: 'Approve budget allocation for Alpha Project',
      description: 'Awaiting your sign-off to proceed with vendor…',
      timeAgo: '10m ago',
      status: 'blocker',
    },
    {
      id: '2',
      priority: 'REVIEW',
      title: 'Draft response for Press Inquiry',
      description: "Review the PR team's draft regarding the recent…",
      timeAgo: '2h ago',
      status: 'review',
    },
    {
      id: '3',
      priority: 'ROUTINE',
      title: 'Weekly status report submission',
      description: 'Compile notes from department leads.',
      timeAgo: 'Yesterday',
      status: 'routine',
    },
  ],
  nextMeeting: {
    id: '1',
    title: 'Leadership Standup',
    time: '10:00 AM - 10:30 AM',
    minutesUntil: 15,
  },
};
