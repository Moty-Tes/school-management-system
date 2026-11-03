import { getApiBaseUrl } from './config';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

// In-flight request deduplication map to prevent concurrent duplicate GET requests
const inFlightGetRequests = new Map<string, Promise<any>>();

async function executeFetch<T>(endpoint: string, options: RequestOptions = {}, retries = 2, delay = 2000): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('sms_access_token');
    } catch {
      // LocalStorage access restricted fallback
    }
  }

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...customHeaders,
  };

  const targetUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : (typeof window !== 'undefined' ? endpoint : `${getApiBaseUrl()}${endpoint}`);

  try {
    const response = await fetch(targetUrl, {
      ...rest,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Handle Rate Limiting (429 Too Many Requests) with Retry-After or Exponential Backoff
    if (response.status === 429 && retries > 0) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSec = retryAfterHeader ? parseFloat(retryAfterHeader) : NaN;
      const waitMs = !isNaN(retryAfterSec)
        ? Math.max(10, Math.floor(retryAfterSec * 1000))
        : (delay * 2 + Math.floor(Math.random() * 500));
      console.warn(`[API] Rate limit (429) hit for ${endpoint}. Backing off for ${waitMs}ms... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, waitMs));
      return executeFetch<T>(endpoint, options, retries - 1, delay * 2);
    }

    // Handle Render cold start / sleeping instance (502 Bad Gateway / 503 Service Unavailable / 504 Gateway Timeout)
    if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
      const jitterDelay = delay + Math.floor(Math.random() * 500);
      console.warn(`[API] Received ${response.status} from ${endpoint}. Server waking up. Retrying in ${jitterDelay}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, jitterDelay));
      return executeFetch<T>(endpoint, options, retries - 1, delay * 1.5);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let defaultMessage = `Request failed (${response.status})`;
      if (response.status === 429) {
        defaultMessage = 'High traffic detected. Please wait a few seconds before trying again.';
      } else if (response.status === 401) {
        defaultMessage = 'Invalid credentials or session expired. Please sign in again.';
      } else if (response.status === 403) {
        defaultMessage = 'You do not have permission to access this institutional resource.';
      } else if (response.status === 503) {
        defaultMessage = 'School service is undergoing maintenance or database sync (HTTP 503).';
      } else if (response.status === 502 || response.status === 504) {
        defaultMessage = 'School service gateway temporarily unavailable (HTTP 502/504). Please retry shortly.';
      }

      const message = data?.error?.message || data?.message || defaultMessage;
      const code = data?.error?.code || (response.status === 429 ? 'RATE_LIMITED' : 'UNKNOWN_ERROR');
      throw new ApiError(message, response.status, code, data?.error?.details);
    }

    return (data?.data !== undefined ? data.data : data) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error / connection reset during container spin-up
    if (retries > 0) {
      const jitterDelay = delay + Math.floor(Math.random() * 500);
      console.warn(`[API] Network error connecting to ${endpoint}. Retrying in ${jitterDelay}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, jitterDelay));
      return executeFetch<T>(endpoint, options, retries - 1, delay * 1.5);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Unable to connect to school server. Please verify your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const hasBody = options.body !== undefined;

  // Deduplicate concurrent in-flight GET requests for the same endpoint
  if (isGet && !hasBody) {
    const cacheKey = endpoint;
    const existing = inFlightGetRequests.get(cacheKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = executeFetch<T>(endpoint, options).finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });

    inFlightGetRequests.set(cacheKey, promise);
    return promise;
  }

  return executeFetch<T>(endpoint, options);
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
