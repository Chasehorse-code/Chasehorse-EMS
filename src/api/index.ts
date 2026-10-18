import type { ChaseHorseApi } from './contract';
import { restApi } from './restApi';

export const api: ChaseHorseApi = restApi;
export { restApi };
export type { ChaseHorseApi, Actor } from './contract';
