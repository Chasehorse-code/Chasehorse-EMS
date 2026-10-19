import type { Task } from '@/types';

const TASKS_KEY = 'chasehorse_stored_tasks';

export function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredTask(task: Task): void {
  try {
    const list = getStoredTasks().filter((t) => t.id !== task.id);
    list.unshift(task);
    localStorage.setItem(TASKS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[TaskRegistry] Failed to save task:', err);
  }
}

export function deleteStoredTask(taskId: string): void {
  try {
    const list = getStoredTasks().filter((t) => t.id !== taskId);
    localStorage.setItem(TASKS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[TaskRegistry] Failed to delete task:', err);
  }
}
