import { create } from 'zustand';
import { AcademicData, Course } from '../features/academic/types';
import { academicService, CreateCoursePayload, CreateAssignmentPayload } from '../services/academic';
import { mockAcademicData } from '../features/academic/mockData';
import { notificationService } from '../services/notifications';

interface AcademicState {
  data: AcademicData;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  submitAssignment: (id: string) => Promise<void>;
  addCourse: (payload: CreateCoursePayload) => Promise<void>;
  addAssignment: (payload: CreateAssignmentPayload) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  data: mockAcademicData,
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const data = await academicService.getData();
      set({ data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  submitAssignment: async (id: string) => {
    const assignment = get().data.assignments.find((a) => a.id === id);
    try {
      await academicService.submitAssignment(id);
      set((state) => ({
        data: {
          ...state.data,
          assignments: state.data.assignments.map((a) =>
            a.id === id ? { ...a, status: 'submitted' as const } : a
          ),
          stats: {
            ...state.data.stats,
            completedAssignments: state.data.stats.completedAssignments + 1,
          },
        },
      }));
      notificationService.notify('✓ Assignment Submitted', assignment?.title ?? 'Assignment marked as submitted').catch(() => {});
    } catch {}
  },

  addCourse: async (payload: CreateCoursePayload) => {
    const course = await academicService.createCourse(payload);
    // Backend returns CourseOut shape — map to frontend Course type
    const mapped: Course = {
      id: (course as any).id,
      code: (course as any).code,
      title: (course as any).title,
      instructor: (course as any).instructor ?? '',
      credits: (course as any).credits,
      currentGrade: 'N/A',
      gradePoint: 0,
      progress: 0,
      color: payload.color ?? '#4d8eff',
      status: 'active',
    };
    set((state) => ({
      data: {
        ...state.data,
        courses: [...state.data.courses, mapped],
        stats: {
          ...state.data.stats,
          creditsEnrolled: state.data.stats.creditsEnrolled + mapped.credits,
        },
      },
    }));
    notificationService.notify('Course Added', `${payload.code} — ${payload.title}`).catch(() => {});
  },

  addAssignment: async (payload: CreateAssignmentPayload) => {
    await academicService.createAssignment(payload);
    notificationService.notify('Assignment Added', payload.title).catch(() => {});
    get().fetchData();
  },

  deleteCourse: async (id: string) => {
    const course = get().data.courses.find((c) => c.id === id);
    set((state) => ({
      data: {
        ...state.data,
        courses: state.data.courses.filter((c) => c.id !== id),
      },
    }));
    await academicService.deleteCourse(id).catch(() => {});
    if (course) notificationService.notify('Course Removed', course.code).catch(() => {});
  },
}));
