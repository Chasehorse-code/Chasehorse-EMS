import type { ChaseHorseApi } from './contract';
import { mockApi } from './mockApi';

/**
 * Swap this export for a REST-backed implementation once the Spring Boot API
 * is available, e.g.:
 *
 *   export const api: ChaseHorseApi = import.meta.env.VITE_API_BASE_URL ? restApi : mockApi;
 */
export const api: ChaseHorseApi = mockApi;
export type { ChaseHorseApi, Actor } from './contract';
