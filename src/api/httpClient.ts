import { supabase } from '@/config/supabase';

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

  let authHeader: Record<string, string> = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader = { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    /* session unavailable */
  }

  const res = await fetch(`${BASE_URL}${path}${qs}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...headers,
    },
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
