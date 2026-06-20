/**
 * Thin HTTP client wrapping fetch.
 *
 * - Auto-injects JWT from authStore
 * - Auto-transforms request bodies to snake_case
 * - Auto-transforms response bodies to camelCase
 * - Handles 401 → global logout
 * - Throws ApiError on non-2xx responses
 */

import { toCamelCase, toSnakeCase } from './transform';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function getToken(): Promise<string | null> {
  try {
    const { useAuthStore } = await import('../stores/authStore');
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
}

async function handleLogout(): Promise<void> {
  try {
    const { useAuthStore } = await import('../stores/authStore');
    useAuthStore.getState().logout();
  } catch {
    // ignore during module init
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  // Build URL with query params
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build request
  const options: RequestInit = { method, headers };

  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(toSnakeCase(body));
  }

  // Fetch
  let res: Response;
  try {
    res = await fetch(url.pathname + url.search, options);
  } catch {
    throw new ApiError(0, 'Network error — unable to reach the server');
  }

  // Handle 401 globally
  if (res.status === 401) {
    await handleLogout();
    throw new ApiError(401, 'Session expired — please log in again');
  }

  // Parse response
  let data: unknown;
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) {
      throw new ApiError(res.status, text || res.statusText);
    }
    return text as unknown as T;
  }

  // Handle API error responses
  if (!res.ok) {
    const apiErr = data as { error?: string; code?: string } | undefined;
    throw new ApiError(res.status, apiErr?.error || 'Request failed', apiErr?.code);
  }

  // Transform from snake_case to camelCase
  const apiResponse = data as { data?: unknown; meta?: unknown } | undefined;
  if (apiResponse && 'data' in apiResponse) {
    const transformed = {
      ...apiResponse,
      data: toCamelCase(apiResponse.data),
      meta: apiResponse.meta ? toCamelCase(apiResponse.meta) : undefined,
    } as T;
    return transformed;
  }

  return toCamelCase(data) as T;
}

// ---- Public API ----

export function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  return request<T>('GET', `/api${path}`, undefined, params);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', `/api${path}`, body);
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', `/api${path}`, body);
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', `/api${path}`, body);
}

export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', `/api${path}`);
}

export default { get, post, put, patch, del };
