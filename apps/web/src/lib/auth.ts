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
  return api.post<LoginResponse>('/api/v1/auth/login', input);
}

export async function logout(): Promise<void> {
  await api.post('/api/v1/auth/logout');
}

export async function getMe(): Promise<{ userId: string; tenantId: string; sessionId: string; roles: string[]; email?: string; firstName?: string | null; lastName?: string | null }> {
  return api.get('/api/v1/auth/me');
}