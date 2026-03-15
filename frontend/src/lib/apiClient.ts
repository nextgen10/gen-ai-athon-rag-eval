/**
 * Centralized API client for RagEval backend.
 *
 * - Base URL driven by NEXT_PUBLIC_API_URL (falls back to localhost for dev)
 * - Automatic retry with exponential back-off for transient failures
 * - Consistent error handling: throws ApiError with status + message
 */

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch wrapper with retry + exponential back-off.
 * Retries on network errors or 5xx responses (not 4xx – those are caller errors).
 */
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  { maxAttempts = 3, initialDelayMs = 300 }: RetryOptions = {},
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, init);
      // Don't retry 4xx – those are request-level errors.
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
      lastError = new ApiError(res.status, `HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(initialDelayMs * 2 ** attempt);
    }
  }
  throw lastError;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.detail ?? body?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

// ─── Typed API methods ────────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithRetry(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  return res.json() as Promise<T>;
}

/** POST with JSON body */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** POST with FormData (file upload) */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  // No Content-Type header — browser sets multipart boundary automatically.
  return apiFetch<T>(path, { method: 'POST', body: formData });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}
