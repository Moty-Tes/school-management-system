import { PrismaClient, UserStatus, TenantStatus, TenantTier, UserTenantStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================================
// PERMISSIONS — every action the platform recognizes
// ============================================================================

const PERMISSIONS = [
  // Identity
  { slug: 'users.read', category: 'identity', resource: 'User', action: 'read', description: 'View users' },
  { slug: 'users.create', category: 'identity', resource: 'User', action: 'create', description: 'Create users' },
  { slug: 'users.update', category: 'identity', resource: 'User', action: 'update', description: 'Edit users' },
  { slug: 'users.delete', category: 'identity', resource: 'User', action: 'delete', description: 'Delete users' },
  { slug: 'roles.read', category: 'identity', resource: 'Role', action: 'read', description: 'View roles' },
  { slug: 'roles.manage', category: 'identity', resource: 'Role', action: 'manage', description: 'Manage roles and permissions' },

  // Tenancy (super admin only)
  { slug: 'tenants.read', category: 'tenancy', resource: 'Tenant', action: 'read', description: 'View tenants' },
  { slug: 'tenants.create', category: 'tenancy', resource: 'Tenant', action: 'create', description: 'Create tenants' },
  { slug: 'tenants.update', category: 'tenancy', resource: 'Tenant', action: 'update', description: 'Edit tenants' },
  { slug: 'tenants.delete', category: 'tenancy', resource: 'Tenant', action: 'delete', description: 'Delete tenants' },

  // Students
  { slug: 'students.read', category: 'people', resource: 'Student', action: 'read', description: 'View students' },
  { slug: 'students.create', category: 'people', resource: 'Student', action: 'create', description: 'Create students' },
  { slug: 'students.update', category: 'people', resource: 'Student', action: 'update', description: 'Edit students' },
  { slug: 'students.delete', category: 'people', resource: 'Student', action: 'delete', description: 'Delete students' },

  // Staff
  { slug: 'staff.read', category: 'people', resource: 'Staff', action: 'read', description: 'View staff' },
  { slug: 'staff.create', category: 'people', resource: 'Staff', action: 'create', description: 'Create staff' },
  { slug: 'staff.update', category: 'people', resource: 'Staff', action: 'update', description: 'Edit staff' },
  { slug: 'staff.delete', category: 'people', resource: 'Staff', action: 'delete', description: 'Delete staff' },

  // Academics
  { slug: 'classes.read', category: 'academics', resource: 'Class', action: 'read', description: 'View classes' },
  { slug: 'classes.create', category: 'academics', resource: 'Class', action: 'create', description: 'Create classes' },
  { slug: 'classes.update', category: 'academics', resource: 'Class', action: 'update', description: 'Edit classes' },
  { slug: 'classes.delete', category: 'academics', resource: 'Class', action: 'delete', description: 'Delete classes' },
  { slug: 'subjects.read', category: 'academics', resource: 'Subject', action: 'read', description: 'View subjects' },
  { slug: 'subjects.manage', category: 'academics', resource: 'Subject', action: 'manage', description: 'Manage subjects' },
  { slug: 'timetable.read', category: 'academics', resource: 'Timetable', action: 'read', description: 'View timetable' },
  { slug: 'timetable.manage', category: 'academics', resource: 'Timetable', action: 'manage', description: 'Manage timetable' },

  // Attendance
  { slug: 'attendance.read', category: 'attendance', resource: 'Attendance', action: 'read', description: 'View attendance' },
  { slug: 'attendance.mark', category: 'attendance', resource: 'Attendance', action: 'mark', description: 'Mark attendance' },
  { slug: 'attendance.edit', category: 'attendance', resource: 'Attendance', action: 'edit', description: 'Edit attendance records' },

  // Assessment
  { slug: 'assessments.read', category: 'assessment', resource: 'Assessment', action: 'read', description: 'View assessments' },
  { slug: 'assessments.create', category: 'assessment', resource: 'Assessment', action: 'create', description: 'Create assessments' },
  { slug: 'assessments.update', category: 'assessment', resource: 'Assessment', action: 'update', description: 'Edit assessments' },
  { slug: 'assessments.delete', category: 'assessment', resource: 'Assessment', action: 'delete', description: 'Delete assessments' },
  { slug: 'grades.read', category: 'assessment', resource: 'Grade', action: 'read', description: 'View grades' },
  { slug: 'grades.enter', category: 'assessment', resource: 'Grade', action: 'enter', description: 'Enter grades' },
  { slug: 'grades.publish', category: 'assessment', resource: 'Grade', action: 'publish', description: 'Publish grades' },

  // Finance
  { slug: 'fees.read', category: 'finance', resource: 'Fee', action: 'read', description: 'View fee structures' },
  { slug: 'fees.manage', category: 'finance', resource: 'Fee', action: 'manage', description: 'Manage fee structures' },
  { slug: 'invoices.read', category: 'finance', resource: 'Invoice', action: 'read', description: 'View invoices' },
  { slug: 'invoices.create', category: 'finance', resource: 'Invoice', action: 'create', description: 'Create invoices' },
  { slug: 'payments.read', category: 'finance', resource: 'Payment', action: 'read', description: 'View payments' },
  { slug: 'payments.record', category: 'finance', resource: 'Payment', action: 'record', description: 'Record payments' },
  { slug: 'payments.refund', category: 'finance', resource: 'Payment', action: 'refund', description: 'Refund payments' },
  { slug: 'reports.finance', category: 'finance', resource: 'Report', action: 'finance', description: 'View financial reports' },

  // Communication
  { slug: 'messages.read', category: 'communication', resource: 'Message', action: 'read', description: 'Read messages' },
  { slug: 'messages.send', category: 'communication', resource: 'Message', action: 'send', description: 'Send messages' },
  { slug: 'announcements.read', category: 'communication', resource: 'Announcement', action: 'read', description: 'Read announcements' },
  { slug: 'announcements.create', category: 'communication', resource: 'Announcement', action: 'create', description: 'Create announcements' },
];

// ============================================================================
// ROLES — slug -> permissions ('*' means all)
// ============================================================================

const ROLES: Record<string, { name: string; description: string; permissions: string[] | '*' }> = {
  SUPER_ADMIN: {
    name: 'Super Administrator',
    description: 'Platform owner with access to all tenants',
    permissions: '*',
  },
  TENANT_ADMIN: {
    name: 'School Administrator',
    description: 'Full control over a single school',
    permissions: [
      'users.read', 'users.create', 'users.update', 'users.delete',
      'roles.read', 'roles.manage',
      'students.read', 'students.create', 'students.update', 'students.delete',
      'staff.read', 'staff.create', 'staff.update', 'staff.delete',
      'classes.read', 'classes.create', 'classes.update', 'classes.delete',
      'subjects.read', 'subjects.manage',
      'timetable.read', 'timetable.manage',
      'attendance.read', 'attendance.mark', 'attendance.edit',
      'assessments.read', 'assessments.create', 'assessments.update', 'assessments.delete',
      'grades.read', 'grades.enter', 'grades.publish',
      'fees.read', 'fees.manage', 'invoices.read', 'invoices.create',
      'payments.read', 'payments.record', 'payments.refund', 'reports.finance',
      'messages.read', 'messages.send',
      'announcements.read', 'announcements.create',
    ],
  },
  REGISTRAR: {
    name: 'Registrar',
    description: 'Manages student records and admissions',
    permissions: [
      'students.read', 'students.create', 'students.update',
      'classes.read', 'subjects.read', 'attendance.read',
      'messages.read', 'messages.send', 'announcements.read',
    ],
  },
  TEACHER: {
    name: 'Teacher',
    description: 'Teaching staff',
    permissions: [
      'students.read', 'classes.read', 'subjects.read', 'timetable.read',
      'attendance.read', 'attendance.mark',
      'assessments.read', 'assessments.create', 'assessments.update',
      'grades.read', 'grades.enter',
      'messages.read', 'messages.send', 'announcements.read',
    ],
  },
  STUDENT: {
    name: 'Student',
    description: 'Enrolled student',
    permissions: [
      'classes.read', 'subjects.read', 'timetable.read',
      'attendance.read', 'assessments.read', 'grades.read',
      'messages.read', 'announcements.read',
    ],
  },
  PARENT: {
    name: 'Parent',
    description: 'Parent or guardian',
    permissions: [
      'students.read', 'attendance.read', 'grades.read',
      'invoices.read', 'payments.read',
      'messages.read', 'messages.send', 'announcements.read',
    ],
  },
  ACCOUNTANT: {
    name: 'Accountant',
    description: 'Manages fees and payments',
    permissions: [
      'students.read',
      'fees.read', 'fees.manage', 'invoices.read', 'invoices.create',
      'payments.read', 'payments.record', 'payments.refund', 'reports.finance',
      'messages.read', 'messages.send',
    ],
  },
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🌱 Seeding database...\n');

  console.log('🧹 Cleaning up existing seed data...');
  await prisma.userTenantRole.deleteMany({});
  await prisma.userTenant.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.loginAttempt.deleteMany({});
  await prisma.mFADevice.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.emailVerification.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log('🏢 Creating system tenant...');
  const systemTenant = await prisma.tenant.create({
    data: {
      code: '_system'.toLowerCase(),
      name: 'SMS Platform',
      slug: '_system',
      status: TenantStatus.ACTIVE,
      tier: TenantTier.SHARED,
      country: 'ET',
      timezone: 'Africa/Addis_Ababa',
      locale: 'en',
    },
  });

  console.log(`🔐 Creating ${PERMISSIONS.length} permissions...`);
  await prisma.permission.createMany({
    data: PERMISSIONS,
    skipDuplicates: true,
  });
  const allPermissions = await prisma.permission.findMany();

  console.log(`🎭 Creating ${Object.keys(ROLES).length} system roles...`);
  const roleMap: Record<string, string> = {};
  for (const [slug, def] of Object.entries(ROLES)) {
    const role = await prisma.role.create({
      data: {
        tenantId: null,
        name: def.name,
        slug,
        description: def.description,
        isSystem: true,
      },
    });
    roleMap[slug] = role.id;
  }

  console.log('🔗 Mapping permissions to roles...');
  for (const [slug, def] of Object.entries(ROLES)) {
    const roleId = roleMap[slug];
    const slugs = def.permissions === '*' ? allPermissions.map((p) => p.slug) : def.permissions;
    const rows = slugs
      .map((s) => {
        const p = allPermissions.find((x) => x.slug === s);
        return p ? { roleId, permissionId: p.id } : null;
      })
      .filter((x): x is { roleId: string; permissionId: string } => x !== null);
    await prisma.rolePermission.createMany({ data: rows, skipDuplicates: true });
  }

  console.log('👑 Creating super admin user...');
  const superAdminPassword = 'SuperAdmin123!';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 12);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@sms.local',
      passwordHash: superAdminHash,
      emailVerified: new Date(),
      status: UserStatus.ACTIVE,
      profile: {
        create: { firstName: 'Super', lastName: 'Admin', locale: 'en', timezone: 'Africa/Addis_Ababa' },
      },
    },
  });
  const superAdminLink = await prisma.userTenant.create({
    data: { userId: superAdmin.id, tenantId: systemTenant.id, status: UserTenantStatus.ACTIVE },
  });
  await prisma.userTenantRole.create({
    data: { userTenantId: superAdminLink.id, roleId: roleMap['SUPER_ADMIN']! },
  });

  console.log('🏫 Creating demo school tenant...');
  const demoSchool = await prisma.tenant.create({
    data: {
      code: 'demo-school'.toLowerCase(),
      name: 'Demo Excellence Academy',
      slug: 'demo-school',
      status: TenantStatus.ACTIVE,
      tier: TenantTier.SHARED,
      country: 'ET',
      region: 'Addis Ababa',
      timezone: 'Africa/Addis_Ababa',
      locale: 'en',
    },
  });

  console.log('👥 Creating demo school personas for client pitches & safe practice...');

  const DEMO_PERSONAS = [
    {
      role: 'TENANT_ADMIN',
      email: 'admin@demo-school.local',
      password: 'DemoAdmin123!',
      firstName: 'Alemayehu',
      lastName: 'Girma',
      gender: 'MALE' as const,
      title: 'School Principal & Administrator',
    },
    {
      role: 'REGISTRAR',
      email: 'registrar@demo-school.local',
      password: 'Registrar123!',
      firstName: 'Dawit',
      lastName: 'Bekele',
      gender: 'MALE' as const,
      title: 'Admissions Registrar',
    },
    {
      role: 'TEACHER',
      email: 'teacher@demo-school.local',
      password: 'Teacher123!',
      firstName: 'Abebe',
      lastName: 'Kebede',
      gender: 'MALE' as const,
      title: 'Senior Teacher',
    },
    {
      role: 'ACCOUNTANT',
      email: 'accountant@demo-school.local',
      password: 'Accountant123!',
      firstName: 'Sara',
      lastName: 'Tadesse',
      gender: 'FEMALE' as const,
      title: 'Finance Officer & Bursar',
    },
    {
      role: 'STUDENT',
      email: 'student@demo-school.local',
      password: 'Student123!',
      firstName: 'Almaz',
      lastName: 'Hailu',
      gender: 'FEMALE' as const,
      title: 'Grade 10 Student',
    },
    {
      role: 'PARENT',
      email: 'parent@demo-school.local',
      password: 'Parent123!',
      firstName: 'Mulugeta',
      lastName: 'Tesfaye',
      gender: 'MALE' as const,
      title: 'Parent & Guardian',
    },
  ];
  
  for (const persona of DEMO_PERSONAS) {
    const roleId = roleMap[persona.role];
    if (!roleId) continue;

    const hash = await bcrypt.hash(persona.password, 12);
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
            gender: persona.gender,
            locale: 'en',
            timezone: 'Africa/Addis_Ababa',
          },
        },
      },
    });

    const userTenant = await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: demoSchool.id,
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

  console.log('\n✅ Seed complete!\n');
  console.log('━'.repeat(76));
  console.log('  PLATFORM SUPER ADMIN (system tenant: _system)');
  console.log('  Email:    superadmin@sms.local');
  console.log(`  Password: ${superAdminPassword}`);
  console.log('━'.repeat(76));
  console.log('  DEMO MANAGEMENT SYSTEM PERSONAS (tenant: demo-school)');
  console.log('  Safe sandbox for client pitches, demonstrations, and trial practice:');
  console.log('━'.repeat(76));
  for (const persona of DEMO_PERSONAS) {
    const roleLabel = ROLES[persona.role]?.name ?? persona.role;
    console.log(`  [${roleLabel.padEnd(22)}] ${persona.email.padEnd(30)} Password: ${persona.password}`);
  }
  console.log('━'.repeat(76));
  console.log('\n💡 Tip: Prospective clients can safely practice on these accounts without');
  console.log('   risking production data. Reset anytime via the Demo API or db:seed.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });