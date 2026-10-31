import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AuthTenant {
  id: string;
  code: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantCode: string;
}

export interface LoginResponse {
  user: AuthUser;
  tenant: AuthTenant;
  accessToken: string;
  expiresAt: string;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/v1/auth/login', input);
  if (res && res.accessToken && typeof window !== 'undefined') {
    try {
      localStorage.setItem('sms_access_token', res.accessToken);
      if (res.user) {
        localStorage.setItem('sms_user', JSON.stringify(res.user));
      }
    } catch {
      // Ignore storage errors
    }
  }
  return res;
}

export async function logout(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sms_access_token');
      localStorage.removeItem('sms_user');
    }
    await api.post('/api/v1/auth/logout');
  } catch {
    // Ignore logout failure
  }
}

export async function getMe(): Promise<{ userId: string; tenantId: string; sessionId: string; roles: string[]; email?: string; firstName?: string | null; lastName?: string | null } | null> {
  try {
    const res = await api.get<any>('/api/v1/auth/me');
    return res || null;
  } catch {
    return null;
  }
}
