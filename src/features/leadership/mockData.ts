import { TeamMember, DelegationItem, Meeting, ProjectMilestone } from './types';

export const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Alex Chen', role: 'Operations Lead', initials: 'AC', isOnline: true, currentActivity: 'Editing orientation_plan.v2' },
  { id: '2', name: 'Sarah Miller', role: 'Finance Lead', initials: 'SM', isOnline: true, currentActivity: 'Meeting: Finance Sync' },
  { id: '3', name: 'Marcus T.', role: 'Media Lead', initials: 'MT', isOnline: false, currentActivity: undefined },
  { id: '4', name: 'Jordan K.', role: 'Engagement Lead', initials: 'JK', isOnline: false, currentActivity: undefined },
];

export const mockDelegations: DelegationItem[] = [
  { id: '1', title: 'Venue Booking', description: 'Liaise with Student Union for Oct 1st event', category: 'LOGISTICS', categoryColor: '#adc6ff', status: 'PENDING' },
  { id: '2', title: 'Equipment Rental', description: 'AV gear reserved for keynote', category: 'LOGISTICS', categoryColor: '#adc6ff', status: 'COMPLETED' },
  { id: '3', title: 'Visual Identity', description: 'Design system for Fall orientation branding', category: 'CREATIVE', categoryColor: '#d0bcff', status: 'ACTIVE', progress: 0.65 },
  { id: '4', title: 'Social Campaign', description: 'Starting next Tuesday 09:00', category: 'CREATIVE', categoryColor: '#d0bcff', status: 'UPCOMING' },
  { id: '5', title: 'Volunteer Training', description: 'Enrollment status: 12/40', category: 'ENGAGEMENT', categoryColor: '#4edea3', status: 'ACTIVE' },
];

export const mockMeetings: Meeting[] = [
  { id: '1', title: 'Leadership Standup', time: 'In 12 min', location: 'Virtual', attendeeCount: 8, status: 'upcoming', minutesUntil: 12 },
  { id: '2', title: 'Post-Mortem: Spring Gala', time: '15:00', location: 'Conference Room B', attendeeCount: 5, status: 'upcoming' },
];

export const mockMilestones: ProjectMilestone[] = [
  { date: '15', month: 'AUG', label: 'Social Launch', sublabel: '', isCurrent: false, isComplete: true },
  { date: '01', month: 'SEP', label: 'Volunteer Training', sublabel: 'Current', isCurrent: true, isComplete: false },
  { date: '15', month: 'SEP', label: 'Final Review', sublabel: '', isCurrent: false, isComplete: false },
  { date: '01', month: 'OCT', label: 'ORIENTATION', sublabel: '', isCurrent: false, isComplete: false },
];
