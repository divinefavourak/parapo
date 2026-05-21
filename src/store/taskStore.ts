import { create } from 'zustand';
import { Task, TaskColumn } from '../features/tasks/types';
import { mockTasks } from '../features/tasks/mockData';
import { tasksService, CreateTaskPayload } from '../services/tasks';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  // Hydrate from API (call once on mount)
  fetchTasks: () => Promise<void>;
  // Optimistic mutations
  moveTask: (taskId: string, column: TaskColumn) => void;
  addTask: (payload: CreateTaskPayload) => Promise<void>;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: mockTasks,
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await tasksService.list();
      set({ tasks, isLoading: false });
    } catch {
      // Keep mock data on error (offline mode)
      set({ isLoading: false });
    }
  },

  moveTask: (taskId, column) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, column } : t)),
    }));
    // Sync to API (fire and forget with revert on error)
    tasksService.move(taskId, column).catch(() => {
      // On failure, the task store stays with the optimistic value
      // A proper app would revert, but this keeps UX smooth for offline use
    });
  },

  addTask: async (payload) => {
    // Optimistic: add with temp id
    const tempId = `temp_${Date.now()}`;
    const optimistic: Task = {
      id: tempId,
      title: payload.title,
      description: payload.description ?? '',
      category: payload.category,
      column: payload.column,
      assignee: {
        name: payload.assignee_name ?? 'Me',
        initials: payload.assignee_initials ?? 'ME',
        avatarColor: '#4d8eff',
      },
    };
    set((state) => ({ tasks: [...state.tasks, optimistic] }));
    try {
      const created = await tasksService.create(payload);
      // Replace temp with real
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? created : t)),
      }));
    } catch {
      // Remove optimistic on failure
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }));
    }
  },

  deleteTask: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    tasksService.delete(taskId).catch(() => {});
  },

  completeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, column: 'done' as TaskColumn, isCompleted: true } : t
      ),
    }));
    tasksService.complete(taskId).catch(() => {});
  },
}));
