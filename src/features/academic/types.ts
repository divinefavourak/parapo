export type CourseStatus = 'active' | 'completed' | 'upcoming';
export type AssignmentStatus = 'pending' | 'submitted' | 'overdue' | 'graded';
export type AssignmentPriority = 'high' | 'medium' | 'low';

export interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  currentGrade: string;
  gradePoint: number;
  progress: number;
  color: string;
  status: CourseStatus;
}

export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  dueDate: string;
  dueTimeLabel: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  percentOfGrade: number;
}

export interface StudyGoal {
  id: string;
  label: string;
  targetHours: number;
  completedHours: number;
}

export interface SemesterStats {
  currentGPA: number;
  targetGPA: number;
  creditsCompleted: number;
  creditsEnrolled: number;
  totalAssignments: number;
  completedAssignments: number;
  studyHoursThisWeek: number;
}

export interface AcademicData {
  semesterLabel: string;
  stats: SemesterStats;
  courses: Course[];
  assignments: Assignment[];
  studyGoals: StudyGoal[];
}
