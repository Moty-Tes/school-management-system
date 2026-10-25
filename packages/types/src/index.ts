import { z } from 'zod';

// ============================================================================
// SHARED API RESPONSE SHAPES
// ============================================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================================
// SHARED ENUMS (mirror Prisma enums for frontend use)
// ============================================================================

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  REGISTRAR: 'REGISTRAR',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

// ============================================================================
// SHARED ZOD SCHEMAS — AUTH
// ============================================================================

export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  tenantCode: z.string().min(1, 'Tenant code is required').trim(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  tenantCode: z.string().min(1).max(50).trim(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================================================
// TYPES FROM SCHEMAS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;