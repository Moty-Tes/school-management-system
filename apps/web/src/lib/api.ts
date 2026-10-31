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

async function request<T>(endpoint: string, options: RequestOptions = {}, retries = 4, delay = 1500): Promise<T> {
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

  try {
    const response = await fetch(endpoint, {
      ...rest,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Handle Render cold start / sleeping instance (502 Bad Gateway / 503 Service Unavailable / 504 Gateway Timeout)
    if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
      console.warn(`[API] Received ${response.status} from ${endpoint}. Server may be waking up. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, delay));
      return request<T>(endpoint, options, retries - 1, delay + 1000);
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
      const message = data?.error?.message || data?.message || `Request failed (${response.status})`;
      const code = data?.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(message, response.status, code, data?.error?.details);
    }

    return (data?.data !== undefined ? data.data : data) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error / connection reset / socket hang up during container spin-up
    if (retries > 0) {
      console.warn(`[API] Network error connecting to ${endpoint}. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, delay));
      return request<T>(endpoint, options, retries - 1, delay + 1000);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Unable to connect to school server. Please verify your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
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
