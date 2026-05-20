import { useTaskStore } from '../store/taskStore';
import { TaskColumn } from '../features/tasks/types';

export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  const moveTask = useTaskStore((s) => s.moveTask);
  const addTask = useTaskStore((s) => s.addTask);

  function byColumn(column: TaskColumn) {
    return tasks.filter((t) => t.column === column);
  }

  return { tasks, byColumn, moveTask, addTask };
}
