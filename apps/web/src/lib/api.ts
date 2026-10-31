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

async function request<T>(endpoint: string, options: RequestOptions = {}, retries = 2): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    Accept: 'application/json',
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

    // Handle Render cold start / sleeping instance (502 / 503 / 504)
    if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return request<T>(endpoint, options, retries - 1);
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
      const message = data?.error?.message || `Request failed (${response.status})`;
      const code = data?.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(message, response.status, code, data?.error?.details);
    }

    // Unwrap { success, data } envelope
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data as T;
    }
    return data as T;
  } catch (err: any) {
    if (retries > 0 && (err?.message?.includes('fetch failed') || err?.code === 'ECONNRESET' || err?.name === 'TypeError')) {
      await new Promise((r) => setTimeout(r, 1500));
      return request<T>(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'POST', body }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PUT', body }),

  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
