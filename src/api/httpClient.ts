/**
 * Thin fetch wrapper for the FUTURE Spring Boot REST API. Not used by the
 * prototype — it exists so a `restApi` implementation of `ChaseHorseApi` has a
 * place to start. Authentication (e.g. a Supabase-issued JWT validated by
 * Spring Security) must be added here when the backend exists.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export async function http<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | undefined> } = {},
): Promise<T> {
  const { query, headers, ...rest } = init;
  const qs = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query).filter((e): e is [string, string] => e[1] !== undefined),
      ).toString()
    : '';

  const res = await fetch(`${BASE_URL}${path}${qs}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, `Request failed with ${res.status}`, body);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
