import { create } from 'zustand';
import { Task, TaskColumn } from '../features/tasks/types';
import { mockTasks } from '../features/tasks/mockData';

interface TaskState {
  tasks: Task[];
  moveTask: (taskId: string, column: TaskColumn) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  deleteTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: mockTasks,
  moveTask: (taskId, column) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, column } : t)),
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: Date.now().toString() }],
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),
}));
