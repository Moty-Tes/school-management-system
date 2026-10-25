import { prisma, UserStatus, UserTenantStatus } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
import { AppError } from '../middleware/error.middleware.js';

export interface DemoPersonaMetadata {
  role: string;
  roleName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  title: string;
  description: string;
  tenantCode: string;
}

export const DEMO_TENANT_CODE = 'demo-school';

export const DEMO_PERSONAS: DemoPersonaMetadata[] = [
  {
    role: 'TENANT_ADMIN',
    roleName: 'School Administrator',
    email: 'admin@demo-school.local',
    password: 'DemoAdmin123!',
    firstName: 'Alemayehu',
    lastName: 'Girma',
    title: 'School Principal & Administrator',
    description: 'Full administrative control over school operations, academic years, staff, and configuration.',
    tenantCode: DEMO_TENANT_CODE,
  },
  {
    role: 'REGISTRAR',
    roleName: 'Registrar',
    email: 'registrar@demo-school.local',
    password: 'Registrar123!',
    firstName: 'Dawit',
    lastName: 'Bekele',
    title: 'Admissions Registrar',
    description: 'Manages student enrollment, admissions, class allocations, and student records.',
    tenantCode: DEMO_TENANT_CODE,
  },
  {
    role: 'TEACHER',
    roleName: 'Teacher',
    email: 'teacher@demo-school.local',
    password: 'Teacher123!',
    firstName: 'Abebe',
    lastName: 'Kebede',
    title: 'Senior Mathematics Teacher',
    description: 'Takes daily attendance, creates assignments, enters term grades, and posts classroom updates.',
    tenantCode: DEMO_TENANT_CODE,
  },
  {
    role: 'ACCOUNTANT',
    roleName: 'Accountant',
    email: 'accountant@demo-school.local',
    password: 'Accountant123!',
    firstName: 'Sara',
    lastName: 'Tadesse',
    title: 'Finance Officer & Bursar',
    description: 'Manages tuition fee structures, issues student invoices, records payments, and views finance reports.',
    tenantCode: DEMO_TENANT_CODE,
  },
  {
    role: 'STUDENT',
    roleName: 'Student',
    email: 'student@demo-school.local',
    password: 'Student123!',
    firstName: 'Almaz',
    lastName: 'Hailu',
    title: 'Grade 10 Student',
    description: 'Views class schedules, personal report cards, homework assignments, and announcements.',
    tenantCode: DEMO_TENANT_CODE,
  },
  {
    role: 'PARENT',
    roleName: 'Parent',
    email: 'parent@demo-school.local',
    password: 'Parent123!',
    firstName: 'Mulugeta',
    lastName: 'Tesfaye',
    title: 'Parent & Guardian',
    description: 'Monitors student attendance, checks academic performance, and views pending tuition invoices.',
    tenantCode: DEMO_TENANT_CODE,
  },
];

export async function getDemoInfo() {
  const tenant = await prisma.tenant.findUnique({
    where: { code: DEMO_TENANT_CODE.toLowerCase() },
    include: {
      userTenants: {
        include: {
          user: { include: { profile: true } },
          roles: { include: { role: true } },
        },
      },
    },
  });

  if (!tenant) {
    throw new AppError('Demo tenant not found. Please run seed script first.', 404, 'DEMO_NOT_FOUND');
  }

  return {
    tenant: {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      country: tenant.country,
      region: tenant.region,
      locale: tenant.locale,
      timezone: tenant.timezone,
      tier: tenant.tier,
      status: tenant.status,
    },
    sandbox: {
      isSafeSandbox: true,
      description:
        'This demo environment is completely isolated from production tenants. Prospective clients and staff can practice, experiment, and test workflows safely without risking live institutional data.',
      resetEndpoint: '/api/v1/demo/reset',
    },
    personas: DEMO_PERSONAS,
    capabilities: [
      'Multi-tenant architecture with isolated database records',
      'Role-based access control (RBAC) with 48 fine-grained permissions',
      'Multi-persona client pitch testing (Admin, Teacher, Registrar, Accountant, Student, Parent)',
      '1-click instant demo environment reset',
      'Safe sandbox practice mode for client onboarding',
    ],
  };
}

export async function resetDemoTenant() {
  const tenant = await prisma.tenant.findUnique({
    where: { code: DEMO_TENANT_CODE.toLowerCase() },
  });

  if (!tenant) {
    throw new AppError('Demo tenant not found', 404, 'DEMO_NOT_FOUND');
  }

  // Fetch all system roles
  const roles = await prisma.role.findMany({
    where: { tenantId: null },
  });
  const roleMap = new Map(roles.map((r) => [r.slug, r.id]));

  // Safely cleanup only demo users associated with demo-school
  const demoEmails = DEMO_PERSONAS.map((p) => p.email);
  const existingDemoUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true },
  });
  const userIds = existingDemoUsers.map((u) => u.id);

  if (userIds.length > 0) {
    await prisma.userTenantRole.deleteMany({
      where: { userTenant: { tenantId: tenant.id, userId: { in: userIds } } },
    });
    await prisma.userTenant.deleteMany({
      where: { tenantId: tenant.id, userId: { in: userIds } },
    });
    await prisma.session.deleteMany({
      where: { tenantId: tenant.id },
    });
    await prisma.userProfile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }

  // Re-seed all demo personas with fresh passwords & links
  for (const persona of DEMO_PERSONAS) {
    const roleId = roleMap.get(persona.role);
    if (!roleId) continue;

    const hash = await hashPassword(persona.password);
    const user = await prisma.user.create({
      data: {
        email: persona.email,
        passwordHash: hash,
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            firstName: persona.firstName,
            lastName: persona.lastName,
            locale: 'en',
            timezone: 'Africa/Addis_Ababa',
          },
        },
      },
    });

    const userTenant = await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        status: UserTenantStatus.ACTIVE,
      },
    });

    await prisma.userTenantRole.create({
      data: {
        userTenantId: userTenant.id,
        roleId,
      },
    });
  }

  return {
    success: true,
    message: 'Demo school environment has been successfully reset to its pristine initial state.',
    personas: DEMO_PERSONAS,
  };
}
