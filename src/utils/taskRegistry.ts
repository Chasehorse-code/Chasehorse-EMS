/**
 * DEPRECATED: Client task registry previously used for local mock simulation.
 * Real field tasks are persisted and retrieved authoritatively via PostgreSQL and Spring Boot REST API.
 */
import type { Task } from '@/types';

export function getStoredTasks(): Task[] {
  return [];
}

export function saveStoredTask(_task: Task): void {
  // Production security: no-op; all tasks persisted to server DB
}

export function deleteStoredTask(_taskId: string): void {
  // Production security: no-op
}
