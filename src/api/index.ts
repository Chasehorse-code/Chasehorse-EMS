import type { ChaseHorseApi } from './contract';
import { restApi } from './restApi';
import { mockApi } from './mockApi';

export const api: ChaseHorseApi = restApi;
export { mockApi, restApi };
export type { ChaseHorseApi, Actor } from './contract';
