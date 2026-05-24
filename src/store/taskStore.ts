import { create } from 'zustand';
import { Task, TaskColumn } from '../features/tasks/types';
import { mockTasks } from '../features/tasks/mockData';
import { tasksService, CreateTaskPayload } from '../services/tasks';
import { notificationService } from '../services/notifications';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
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
      set({ isLoading: false });
    }
  },

  moveTask: (taskId, column) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, column } : t)),
    }));
    tasksService.move(taskId, column).catch(() => {});
    if (task) {
      const label = column === 'in_progress' ? 'In Progress' : column === 'done' ? 'Done' : 'Backlog';
      notificationService.notify('Task Moved', `"${task.title}" → ${label}`).catch(() => {});
    }
  },

  addTask: async (payload) => {
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
    notificationService.notify('Task Created', `"${payload.title}" added to ${payload.column.replace('_', ' ')}`).catch(() => {});
    try {
      const created = await tasksService.create(payload);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? created : t)),
      }));
    } catch {
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }));
    }
  },

  deleteTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    tasksService.delete(taskId).catch(() => {});
    if (task) {
      notificationService.notify('Task Deleted', `"${task.title}" removed`).catch(() => {});
    }
  },

  completeTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, column: 'done' as TaskColumn, isCompleted: true } : t
      ),
    }));
    tasksService.complete(taskId).catch(() => {});
    if (task) {
      notificationService.notify('✓ Task Complete', `"${task.title}" marked as done`).catch(() => {});
    }
  },
}));
