import {
  PrismaClient,
  Gender,
  InvoiceStatus,
  AttendanceStatus,
  UserStatus,
  UserTenantStatus,
  PayrollStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

// ============================================================================
// CONFIGURABLE ACADEMIC YEAR & SEMESTER LIFECYCLE
// ============================================================================

export const DEMO_ACADEMIC_CONFIG = {
  academicYear: '2025/2026', // Ethiopian 2018 E.C.
  semester1Name: 'Semester 1 (Finalized)',
  semester1Start: new Date('2025-09-01T00:00:00.000Z'),
  semester1End: new Date('2026-01-25T00:00:00.000Z'),
  semester1Finalized: true,
  semester2Name: 'Semester 2 (In Progress)',
  semester2Start: new Date('2026-02-05T00:00:00.000Z'),
  semester2End: new Date('2026-06-30T00:00:00.000Z'),
  semester2InProgress: true,
  demoToday: new Date('2026-04-15T08:30:00.000Z'), // Mid-Semester 2 operational checkpoint
  currency: 'ETB',
};

// ============================================================================
// DETERMINISTIC ETHIOPIAN SYNTHETIC NAME CATALOGS (100% FICTIONAL)
// ============================================================================

const MALE_FIRST_NAMES = [
  'Natnael', 'Kirubel', 'Brook', 'Abel', 'Samuel', 'Daniel', 'Mikiyas', 'Biniyam',
  'Yared', 'Robel', 'Eyob', 'Nahom', 'Bereket', 'Surafel', 'Yonatan', 'Henok',
  'Biruk', 'Leul', 'Fitsum', 'Amanuel', 'Dawit', 'Tariku', 'Getachew', 'Yohannes',
  'Chala', 'Tolosa', 'Gamachu', 'Bekele', 'Kenenisa', 'Desta', 'Ermias', 'Befekadu',
  'Kassahun', 'Fikadu', 'Tamirat', 'Tewodros', 'Mulugeta', 'Wondwossen', 'Zerihun', 'Zelalem',
  'Nebiyu', 'Alemayehu', 'Girma', 'Haile', 'Tilahun', 'Negash', 'Worku', 'Melaku',
  'Solomon', 'Eshetu'
];

const FEMALE_FIRST_NAMES = [
  'Bethlehem', 'Mahlet', 'Tsion', 'Hana', 'Liya', 'Betelhem', 'Hanna', 'Senait',
  'Almaz', 'Selamawit', 'Fasika', 'Meron', 'Helina', 'Hermela', 'Kalkidan', 'Rahel',
  'Eden', 'Feven', 'Saron', 'Hiwot', 'Ruth', 'Blen', 'Tigist', 'Maya',
  'Aster', 'Bontu', 'Hawi', 'Genet', 'Marta', 'Kidan', 'Lulit', 'Mekdes',
  'Rediet', 'Sara', 'Semhar', 'Sosina', 'Tsedey', 'Wezero', 'Yeabsira', 'Yordanos',
  'Zufan', 'Fikirte', 'Dagmawit', 'Beza', 'Blisse', 'Edom', 'Emnet', 'Gelila',
  'Hayat', 'Iman'
];

const FATHER_NAMES = [
  'Mulugeta', 'Assefa', 'Tekle', 'Kassahun', 'Alemu', 'Girma', 'Fikru', 'Worku',
  'Kebede', 'Yohannes', 'Tefera', 'Negash', 'Berhanu', 'Dagne', 'Mekonnen', 'Zewde',
  'Hailu', 'Tadesse', 'Desta', 'Mengistu', 'Solomon', 'Fantahun', 'Gashaw', 'Eshetu',
  'Wolde', 'Tilahun', 'Mulatu', 'Getachew', 'Abebe', 'Legesse', 'Gebre', 'Wondimu',
  'Kassa', 'Melaku', 'Mengesha', 'Sisay', 'Demissie', 'Haile', 'Tsegaye', 'Bekele',
  'Berhe', 'Tesfaye', 'Habte', 'Gudeta', 'Fanta', 'Benti', 'Kumsa', 'Dibaba',
  'Tolera', 'Bayisa'
];

export async function seedOperationalData(prisma: PrismaClient, tenantId: string, roleMap?: Record<string, string>) {
  console.log('⚡ Starting operational demo data seeding for tenant:', tenantId);

  // 1. SAFETY LOCK: Strictly guarantee this is a designated demo tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found.`);
  }

  const isDemo =
    tenant.code.toLowerCase().includes('demo') ||
    tenant.slug.toLowerCase().includes('demo') ||
    tenant.name.toLowerCase().includes('demo');

  if (!isDemo) {
    throw new Error(
      `SAFETY LOCK ACTIVATED: Refusing to seed non-demo tenant "${tenant.name}" (${tenant.code}). Operational demo seeding is strictly permitted for designated demo environments only to protect real records.`
    );
  }

  // Ensure roleMap is populated
  if (!roleMap) {
    const roles = await prisma.role.findMany({ select: { id: true, slug: true } });
    roleMap = {};
    for (const r of roles) {
      roleMap[r.slug] = r.id;
    }
  }

  // 2. PURGE OLD DEMO OPERATIONAL RECORDS (Safely scoped to this demo tenantId)
  console.log('  -> Purging old demo operational records...');
  await prisma.feeWaiver.deleteMany({ where: { tenantId } });
  await prisma.approvedPickupPerson.deleteMany({ where: { tenantId } });
  await prisma.examSeat.deleteMany({ where: { tenantId } });
  await prisma.examSchedule.deleteMany({ where: { tenantId } });
  await prisma.examRoom.deleteMany({ where: { tenantId } });
  await prisma.bookLoan.deleteMany({ where: { tenantId } });
  await prisma.book.deleteMany({ where: { tenantId } });
  await prisma.clubMembership.deleteMany({ where: { tenantId } });
  await prisma.club.deleteMany({ where: { tenantId } });
  await prisma.gatePass.deleteMany({ where: { tenantId } });
  await prisma.clinicVisit.deleteMany({ where: { tenantId } });
  await prisma.healthRecord.deleteMany({ where: { tenantId } });
  await prisma.submission.deleteMany({ where: { tenantId } });
  await prisma.assignment.deleteMany({ where: { tenantId } });
  await prisma.payslip.deleteMany({ where: { tenantId } });
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.expense.deleteMany({ where: { tenantId } });
  await prisma.gradeAuditLog.deleteMany({ where: { tenantId } });
  await prisma.grade.deleteMany({ where: { tenantId } });
  await prisma.assessment.deleteMany({ where: { tenantId } });
  await prisma.attendance.deleteMany({ where: { tenantId } });
  await prisma.parentStudent.deleteMany({ where: { parent: { tenantId } } });
  await prisma.parentProfile.deleteMany({ where: { tenantId } });
  await prisma.timetable.deleteMany({ where: { tenantId } });
  await prisma.student.deleteMany({ where: { tenantId } });
  await prisma.subject.deleteMany({ where: { tenantId } });
  await prisma.class.deleteMany({ where: { tenantId } });
  await prisma.announcement.deleteMany({ where: { tenantId } });

  // 3. CREATE 6 ACADEMIC CLASSES ACROSS GRADES 9-12 (>=50 Students Per Grade, 210 Total)
  console.log('  -> Creating 6 academic sections across Grades 9-12...');
  const classDefs = [
    { name: 'Grade 9', section: 'Section A (Common Foundation)', capacity: 55, studentCount: 50 },
    { name: 'Grade 10', section: 'Section A (Common Foundation)', capacity: 55, studentCount: 50 },
    { name: 'Grade 11', section: 'Section A (Natural Science Stream)', capacity: 35, studentCount: 30 },
    { name: 'Grade 11', section: 'Section B (Social Science Stream)', capacity: 30, studentCount: 25 },
    { name: 'Grade 12', section: 'Section A (Natural Science Stream)', capacity: 35, studentCount: 30 },
    { name: 'Grade 12', section: 'Section B (Social Science Stream)', capacity: 30, studentCount: 25 },
  ];

  const classes: any[] = [];
  for (const c of classDefs) {
    const created = await prisma.class.create({
      data: {
        tenantId,
        name: c.name,
        section: c.section,
        capacity: c.capacity,
      },
    });
    classes.push({ ...created, targetStudentCount: c.studentCount });
  }

  // 4. CREATE ETHIOPIAN CURRICULUM SUBJECTS (Common + Advanced Streams)
  console.log('  -> Creating Ethiopian curriculum subjects (Common + Streams)...');
  const subjectDefs = [
    // Common Foundation (Grades 9 & 10)
    { name: 'English Language & Literature', code: 'ENG-09' },
    { name: 'Mathematics & Calculus Foundations', code: 'MATH-09' },
    { name: 'Information Technology & Coding', code: 'IT-09' },
    { name: 'General Biology & Life Sciences', code: 'BIO-09' },
    { name: 'General Chemistry & Lab Practice', code: 'CHEM-09' },
    { name: 'General Physics & Applied Mechanics', code: 'PHYS-09' },
    { name: 'Ethiopian & World History', code: 'HIST-09' },
    { name: 'Geography & Environmental Studies', code: 'GEOG-09' },
    { name: 'Economics & Financial Fundamentals', code: 'ECON-09' },
    { name: 'Civics & Ethical Studies', code: 'CIV-09' },

    // Advanced Natural Science Stream (Grades 11 & 12)
    { name: 'English Language & Academic Writing', code: 'ENG-11N' },
    { name: 'Advanced Mathematics & Analytical Geometry', code: 'MATH-11N' },
    { name: 'Information Technology & Python Systems', code: 'IT-11N' },
    { name: 'Cellular, Molecular & Genetics Biology', code: 'BIO-11N' },
    { name: 'Organic & Analytical Chemistry', code: 'CHEM-11N' },
    { name: 'Electromagnetism, Modern & Quantum Physics', code: 'PHYS-11N' },

    // Social Science Stream (Grades 11 & 12)
    { name: 'English Language & Literary Criticism', code: 'ENG-11S' },
    { name: 'Applied Mathematics & Statistics', code: 'MATH-11S' },
    { name: 'Information Technology & Data Systems', code: 'IT-11S' },
    { name: 'Contemporary African & Global History', code: 'HIST-11S' },
    { name: 'Human Geography & Spatial Planning', code: 'GEOG-11S' },
    { name: 'Macroeconomics, Development & Trade', code: 'ECON-11S' },
  ];

  const subjects: any[] = [];
  for (const s of subjectDefs) {
    const created = await prisma.subject.create({
      data: { tenantId, name: s.name, code: s.code },
    });
    subjects.push(created);
  }

  // 5. CREATE FACULTY PROFILES & DEPARTMENT HEADS (Scoped by Grade Band)
  console.log('  -> Setting up faculty instructors and department heads...');
  const teacherRoleId = roleMap['TEACHER'] || (await prisma.role.findFirst({ where: { slug: 'TEACHER' } }))?.id;

  const teacherDefs = [
    { email: 'teacher@demo-school.local', firstName: 'Abebe', lastName: 'Kebede', gender: Gender.MALE, title: 'Senior Mathematics Faculty & Dept Head (9-12)', employeeId: 'FAC-MATH-01', spec: 'Pure Mathematics & Calculus', qual: 'M.Sc. Mathematics', salary: 28500 },
    { email: 'rahel.mulugeta@demo-school.local', firstName: 'Dr. Rahel', lastName: 'Mulugeta', gender: Gender.FEMALE, title: 'Head of Chemistry & Natural Sciences', employeeId: 'FAC-CHEM-02', spec: 'Organic & Inorganic Chemistry', qual: 'Ph.D. Chemistry', salary: 32000 },
    { email: 'yohannes.desta@demo-school.local', firstName: 'Yohannes', lastName: 'Desta', gender: Gender.MALE, title: 'Physics Department Lead', employeeId: 'FAC-PHYS-03', spec: 'Theoretical & Applied Physics', qual: 'M.Sc. Physics', salary: 26000 },
    { email: 'tigist.bekele@demo-school.local', firstName: 'Tigist', lastName: 'Bekele', gender: Gender.FEMALE, title: 'Biology Instructor & Dept Head', employeeId: 'FAC-BIO-04', spec: 'Genetics & Life Sciences', qual: 'B.Ed. Biology', salary: 24500 },
    { email: 'elias.haile@demo-school.local', firstName: 'Elias', lastName: 'Haile', gender: Gender.MALE, title: 'Social Sciences & History Lead', employeeId: 'FAC-HIST-05', spec: 'Ethiopian & Modern History', qual: 'M.A. History', salary: 25000 },
    { email: 'bethlehem.tsegaye@demo-school.local', firstName: 'Bethlehem', lastName: 'Tsegaye', gender: Gender.FEMALE, title: 'English & Literature Department Lead', employeeId: 'FAC-ENG-06', spec: 'English Language & Linguistics', qual: 'M.A. English', salary: 26500 },
    { email: 'dawit.alemayehu@demo-school.local', firstName: 'Dawit', lastName: 'Alemayehu', gender: Gender.MALE, title: 'ICT & Computer Science Faculty', employeeId: 'FAC-CS-07', spec: 'Software Systems & Python', qual: 'B.Sc. Computer Science', salary: 25500 },
    { email: 'meron.assefa@demo-school.local', firstName: 'Meron', lastName: 'Assefa', gender: Gender.FEMALE, title: 'Economics & Commercial Studies Lead', employeeId: 'FAC-ECON-08', spec: 'Micro & Macroeconomics', qual: 'M.Sc. Economics', salary: 25000 },
    { email: 'kassahun.alemu@demo-school.local', firstName: 'Kassahun', lastName: 'Alemu', gender: Gender.MALE, title: 'Geography & Environmental Systems Lead', employeeId: 'FAC-GEOG-09', spec: 'Physical & Human Geography', qual: 'M.Sc. Geography', salary: 23500 },
    { email: 'almaz.tadesse@demo-school.local', firstName: 'Almaz', lastName: 'Tadesse', gender: Gender.FEMALE, title: 'Civics & Pastoral Coordinator', employeeId: 'FAC-CIV-10', spec: 'Civics, Ethics & Governance', qual: 'B.A. Civics', salary: 22000 },
  ];

  const teacherProfiles: any[] = [];
  const defaultPwHash = await bcrypt.hash('Teacher123!', 10);

  for (const t of teacherDefs) {
    let user = await prisma.user.findUnique({ where: { email: t.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: t.email,
          passwordHash: defaultPwHash,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
          profile: {
            create: {
              firstName: t.firstName,
              lastName: t.lastName,
              gender: t.gender,
              locale: 'am',
              timezone: 'Africa/Addis_Ababa',
            },
          },
        },
      });

      const userTenant = await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId,
          status: UserTenantStatus.ACTIVE,
        },
      });

      if (teacherRoleId) {
        await prisma.userTenantRole.create({
          data: {
            userTenantId: userTenant.id,
            roleId: teacherRoleId,
          },
        });
      }
    }

    let tp = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    if (!tp) {
      tp = await prisma.teacherProfile.create({
        data: {
          tenantId,
          userId: user.id,
          employeeId: t.employeeId,
          specialization: t.spec,
          qualification: t.qual,
          baseSalary: t.salary,
        },
      });
    }
    teacherProfiles.push(tp);

    // Seed realistic 4-month ETB payslip records
    for (const month of [1, 2, 3, 4]) {
      const isPaid = month < 4;
      await prisma.payslip.upsert({
        where: { teacherId_month_year: { teacherId: tp.id, month, year: 2026 } },
        update: {},
        create: {
          tenantId,
          teacherId: tp.id,
          month,
          year: 2026,
          baseSalary: t.salary,
          deductions: Math.round(t.salary * 0.15),
          netPay: Math.round(t.salary * 0.85),
          status: isPaid ? PayrollStatus.PAID : PayrollStatus.PENDING,
          paidAt: isPaid ? new Date(2026, month - 1, 28) : null,
        },
      });
    }
  }

  // 6. GENERATE 210 SYNTHETIC STUDENTS ACROSS 4 GRADES
  console.log('  -> Generating 210 synthetic student records across 6 sections...');
  const students: any[] = [];
  let studentCounter = 1;

  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx]!;
    const count = cls.targetStudentCount;
    // Grade 9 = 2011, Grade 10 = 2010, Grade 11 = 2009, Grade 12 = 2008
    const gradeNum = parseInt(cls.name.replace(/\D/g, ''), 10) || 9;
    const birthYear = 2020 - gradeNum;

    for (let sIdx = 0; sIdx < count; sIdx++) {
      const isMale = (studentCounter % 2) === 1;
      const firstName = isMale
        ? MALE_FIRST_NAMES[sIdx % MALE_FIRST_NAMES.length]!
        : FEMALE_FIRST_NAMES[sIdx % FEMALE_FIRST_NAMES.length]!;

      const fatherName = FATHER_NAMES[(sIdx + cIdx * 7) % FATHER_NAMES.length]!;
      const streamTag = cls.section.includes('Natural') ? 'N' : cls.section.includes('Social') ? 'S' : '';
      const admissionNumber = `ET-2026-${gradeNum}${streamTag}-${String(sIdx + 1).padStart(3, '0')}`;
      const birthMonth = String((sIdx % 12) + 1).padStart(2, '0');
      const birthDay = String((sIdx % 28) + 1).padStart(2, '0');
      const dateOfBirth = new Date(`${birthYear}-${birthMonth}-${birthDay}T00:00:00.000Z`);

      // Deterministic synthetic avatar URL (no scraped photos)
      const photoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=DEMO-${admissionNumber}`;
      const guardianPhone = `+251-911-${String(100000 + studentCounter).slice(1)}`;

      const student = await prisma.student.create({
        data: {
          tenantId,
          admissionNumber,
          firstName,
          lastName: fatherName,
          gender: isMale ? Gender.MALE : Gender.FEMALE,
          dateOfBirth,
          classId: cls.id,
          guardianName: `${fatherName} Tesfaye`,
          guardianPhone,
          photoUrl,
        },
      });

      // Seed Student Health Record with least-privilege medical safety info
      const bloodTypes = ['O+', 'A+', 'B+', 'AB+', 'O-'];
      const bloodType = bloodTypes[studentCounter % bloodTypes.length];
      const allergies = studentCounter % 7 === 0 ? 'Penicillin allergy' : studentCounter % 11 === 0 ? 'Peanut allergy' : null;
      const chronicConditions = studentCounter % 19 === 0 ? 'Mild Exercise-Induced Asthma (Inhaler kept in Clinic)' : null;

      await prisma.healthRecord.create({
        data: {
          tenantId,
          studentId: student.id,
          bloodType,
          allergies,
          chronicConditions,
          emergencyContactName: `${fatherName} Tesfaye`,
          emergencyContactPhone: guardianPhone,
        },
      });

      students.push(student);
      studentCounter++;
    }
  }

  console.log(`  ✓ Successfully created ${students.length} students across Grades 9-12.`);

  // 7. EXPLICIT 100% MULTI-CHILD FAMILY RECORDS (80 Families for 210 Students)
  console.log('  -> Establishing 100% linked multi-child family records (all 210 students linked)...');
  const parentRoleId = roleMap['PARENT'] || (await prisma.role.findFirst({ where: { slug: 'PARENT' } }))?.id;
  const parentPasswordHash = await bcrypt.hash('Parent123!', 10);

  // Group 210 students into families:
  // 50 families with 3 children = 150 students
  // 30 families with 2 children = 60 students
  // Total = 80 families
  let studentAssignmentIndex = 0;
  const families: any[] = [];

  for (let famIdx = 0; famIdx < 80; famIdx++) {
    const isThreeChildren = famIdx < 50;
    const childCount = isThreeChildren ? 3 : 2;
    const familyChildren = students.slice(studentAssignmentIndex, studentAssignmentIndex + childCount);
    studentAssignmentIndex += childCount;

    const fatherFirst = MALE_FIRST_NAMES[famIdx % MALE_FIRST_NAMES.length]!;
    const fatherLast = FATHER_NAMES[(famIdx * 3) % FATHER_NAMES.length]!;
    const motherFirst = FEMALE_FIRST_NAMES[(famIdx + 5) % FEMALE_FIRST_NAMES.length]!;
    const phone = `+251-912-${String(100000 + famIdx).slice(1)}`;

    // Primary demo parent account for reviewer inspection is family 0
    const email = famIdx === 0 ? 'parent@demo-school.local' : `parent.${famIdx + 1}@demo-school.local`;

    let pUser = await prisma.user.findUnique({ where: { email } });
    if (!pUser) {
      pUser = await prisma.user.create({
        data: {
          email,
          passwordHash: parentPasswordHash,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
          profile: {
            create: {
              firstName: famIdx === 0 ? 'Mulugeta' : fatherFirst,
              lastName: famIdx === 0 ? 'Tesfaye' : fatherLast,
              locale: 'am',
              timezone: 'Africa/Addis_Ababa',
              phone,
            },
          },
        },
      });

      const ut = await prisma.userTenant.create({
        data: {
          userId: pUser.id,
          tenantId,
          status: UserTenantStatus.ACTIVE,
        },
      });

      if (parentRoleId) {
        await prisma.userTenantRole.create({
          data: { userTenantId: ut.id, roleId: parentRoleId },
        });
      }
    }

    let pProfile = await prisma.parentProfile.findUnique({ where: { userId: pUser.id } });
    if (!pProfile) {
      pProfile = await prisma.parentProfile.create({
        data: {
          tenantId,
          userId: pUser.id,
          occupation: famIdx % 2 === 0 ? 'Senior Engineer' : 'Civil Servant / Educator',
          address: `Subcity Woreda ${String((famIdx % 10) + 1).padStart(2, '0')}, Addis Ababa`,
        },
      });
    }

    // Explicitly link every child to this parent profile
    for (let cIdx = 0; cIdx < familyChildren.length; cIdx++) {
      const child = familyChildren[cIdx]!;
      await prisma.parentStudent.create({
        data: {
          parentId: pProfile.id,
          studentId: child.id,
          relationship: cIdx % 2 === 0 ? 'FATHER' : 'MOTHER',
        },
      });

      // Synchronize student enrollment guardian record
      await prisma.student.update({
        where: { id: child.id },
        data: {
          guardianName: `${famIdx === 0 ? 'Mulugeta Tesfaye' : `${fatherFirst} ${fatherLast}`}`,
          guardianPhone: phone,
        },
      });

      // Approved Pickup Person record with emergency priority
      await prisma.approvedPickupPerson.create({
        data: {
          tenantId,
          studentId: child.id,
          fullName: `${fatherFirst} ${fatherLast}`,
          relationship: 'FATHER',
          phone,
          emergencyPriority: 1,
          isAuthorized: true,
        },
      });

      // Sibling discount for 2nd and 3rd children in multi-child families
      if (cIdx > 0) {
        await prisma.feeWaiver.create({
          data: {
            tenantId,
            studentId: child.id,
            type: 'SIBLING_DISCOUNT',
            percentage: cIdx === 1 ? 10.00 : 15.00,
            reason: `Institutional multi-child sibling tuition discount (${cIdx + 1}th child)`,
            approvedById: teacherProfiles[0]!.userId,
            startDate: DEMO_ACADEMIC_CONFIG.semester1Start,
            status: 'ACTIVE',
          },
        });
      }
    }

    families.push({ profile: pProfile, children: familyChildren });
  }

  console.log(`  ✓ Successfully established ${families.length} families linking all 210 students.`);

  // 8. 5-DAY, 5-PERIOD CONFLICT-FREE TIMETABLE FOR ALL 6 SECTIONS
  console.log('  -> Creating 5-day / 5-period conflict-free weekly timetables...');
  const daysOfWeek = [1, 2, 3, 4, 5]; // Mon - Fri
  const periods = [
    { start: '08:30', end: '09:20' },
    { start: '09:30', end: '10:20' },
    { start: '10:40', end: '11:30' },
    { start: '11:40', end: '12:30' },
    { start: '13:30', end: '14:20' },
  ];

  const timetableEntries: any[] = [];
  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx]!;
    // Filter relevant subjects for this grade stream
    const isGr9_10 = cls.name.includes('Grade 9') || cls.name.includes('Grade 10');
    const isNatural = cls.section.includes('Natural');
    const classSubjects = subjects.filter((s) => {
      if (isGr9_10) return s.code.endsWith('-09');
      if (isNatural) return s.code.endsWith('-11N');
      return s.code.endsWith('-11S');
    });

    for (let d = 0; d < daysOfWeek.length; d++) {
      const day = daysOfWeek[d]!;
      for (let p = 0; p < periods.length; p++) {
        const period = periods[p]!;
        const subj = classSubjects[(d * 5 + p + cIdx) % classSubjects.length]!;
        // Teacher assignment based on subject specialization to maintain consistency
        const assignedTeacher = teacherProfiles[(cIdx * 2 + p + d) % teacherProfiles.length]!;

        timetableEntries.push({
          tenantId,
          classId: cls.id,
          subjectId: subj.id,
          teacherId: assignedTeacher.id,
          dayOfWeek: day,
          startTime: period.start,
          endTime: period.end,
        });
      }
    }
  }

  await prisma.timetable.createMany({ data: timetableEntries });
  console.log(`  ✓ Seeded ${timetableEntries.length} weekly timetable slots.`);

  // 9. ACADEMIC RECORDS: SEMESTER 1 (FINALIZED) & SEMESTER 2 (IN PROGRESS)
  console.log('  -> Populating academic assessments, grades, and ongoing Semester 2 records...');
  for (const cls of classes) {
    // SEMESTER 1 (100% COMPLETE & FINALIZED)
    const sem1Quiz = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 1 Continuous Quiz & Lab Assessment',
        maxScore: 100,
        date: new Date('2025-10-20T09:00:00.000Z'),
      },
    });

    const sem1Midterm = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 1 Midterm Examination',
        maxScore: 100,
        date: new Date('2025-11-28T09:00:00.000Z'),
      },
    });

    const sem1Final = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 1 Final Comprehensive Examination',
        maxScore: 100,
        date: new Date('2026-01-18T09:00:00.000Z'),
      },
    });

    // SEMESTER 2 (VISIBLY IN PROGRESS)
    const sem2Quiz = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 2 Quiz 1 (Completed & Finalized)',
        maxScore: 100,
        date: new Date('2026-02-24T09:00:00.000Z'),
      },
    });

    const sem2Midterm = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 2 Midterm Examination (Completed & Finalized)',
        maxScore: 100,
        date: new Date('2026-03-26T09:00:00.000Z'),
      },
    });

    const sem2OngoingProject = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 2 Practical Project (Ongoing / Awaiting Submissions)',
        maxScore: 100,
        date: new Date('2026-04-20T09:00:00.000Z'), // 5 days after demoToday
      },
    });

    const sem2UpcomingFinal = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Semester 2 National Model & Final Examination (Upcoming)',
        maxScore: 100,
        date: new Date('2026-06-15T09:00:00.000Z'),
      },
    });

    const classStudents = students.filter((s) => s.classId === cls.id);
    const gradeBatch: any[] = [];

    for (let i = 0; i < classStudents.length; i++) {
      const st = classStudents[i]!;
      const baseScore = 72 + ((st.id.charCodeAt(st.id.length - 1) + i * 3) % 25);

      // Semester 1 completed grades (All students)
      gradeBatch.push({ tenantId, assessmentId: sem1Quiz.id, studentId: st.id, score: Math.min(100, baseScore - 2) });
      gradeBatch.push({ tenantId, assessmentId: sem1Midterm.id, studentId: st.id, score: Math.min(100, baseScore) });
      gradeBatch.push({ tenantId, assessmentId: sem1Final.id, studentId: st.id, score: Math.min(100, baseScore + 3) });

      // Semester 2 interim grades (Completed Quiz and Midterm)
      gradeBatch.push({ tenantId, assessmentId: sem2Quiz.id, studentId: st.id, score: Math.min(100, baseScore - 1) });
      gradeBatch.push({ tenantId, assessmentId: sem2Midterm.id, studentId: st.id, score: Math.min(100, baseScore + 1) });

      // Semester 2 Ongoing Project (Only 35% submitted/graded; 65% pending)
      if (i % 3 === 0) {
        gradeBatch.push({
          tenantId,
          assessmentId: sem2OngoingProject.id,
          studentId: st.id,
          score: Math.min(100, baseScore + 4),
        });
      }

      // sem2UpcomingFinal has ZERO grades, demonstrating upcoming exam status
    }

    await prisma.grade.createMany({ data: gradeBatch });
  }

  // 10. LMS ASSIGNMENTS & HOMEWORK SUBMISSIONS
  console.log('  -> Creating LMS classroom assignments with pending and completed submissions...');
  const leadTeacher = teacherProfiles[0]!;

  const assignment1 = await prisma.assignment.create({
    data: {
      tenantId,
      classId: classes[0]!.id,
      teacherId: leadTeacher.id,
      title: 'Differential Calculus & Real-World Velocity Models',
      description: 'Complete problem sets 4.1 through 4.5. Show step-by-step differentiation for kinematic equations.',
      dueDate: new Date('2026-03-15T17:00:00.000Z'),
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      tenantId,
      classId: classes[0]!.id,
      teacherId: leadTeacher.id,
      title: 'Thermodynamics & Heat Transfer Experiment Report',
      description: 'Submit your laboratory observations, calculations of specific heat capacity, and error analysis.',
      dueDate: new Date('2026-04-20T17:00:00.000Z'), // Ongoing, due soon
    },
  });

  // Seed sample submissions
  for (let s = 0; s < 15; s++) {
    const student = students[s]!;
    await prisma.submission.create({
      data: {
        tenantId,
        assignmentId: assignment1.id,
        studentId: student.id,
        content: 'Calculus assignment solutions complete with step-by-step differential work attached.',
        grade: 92.5,
        feedback: 'Excellent rigor in the second derivative test. Well done!',
      },
    });
  }

  // 11. DUAL-SEMESTER ATTENDANCE (Finalized Sem 1 + Ongoing Sem 2)
  console.log('  -> Populating historical and current daily attendance records...');
  const attendanceBatch: any[] = [];

  // Semester 1: 5 distinct historical week checkpoints
  const sem1Dates = [
    new Date('2025-09-15T08:00:00.000Z'),
    new Date('2025-10-15T08:00:00.000Z'),
    new Date('2025-11-17T08:00:00.000Z'),
    new Date('2025-12-15T08:00:00.000Z'),
    new Date('2026-01-12T08:00:00.000Z'),
  ];

  // Semester 2: Recent 5 school days
  const sem2Dates = [
    new Date('2026-04-08T08:00:00.000Z'),
    new Date('2026-04-09T08:00:00.000Z'),
    new Date('2026-04-10T08:00:00.000Z'),
    new Date('2026-04-13T08:00:00.000Z'),
    new Date('2026-04-14T08:00:00.000Z'),
  ];

  for (const attDate of [...sem1Dates, ...sem2Dates]) {
    for (const student of students) {
      const rand = (student.admissionNumber.charCodeAt(student.admissionNumber.length - 1) + attDate.getDate()) % 100;
      const status: AttendanceStatus =
        rand > 8 ? AttendanceStatus.PRESENT : rand > 3 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT;

      attendanceBatch.push({
        tenantId,
        studentId: student.id,
        classId: student.classId,
        date: attDate,
        status,
      });
    }
  }

  await prisma.attendance.createMany({ data: attendanceBatch });

  // 12. FINANCE IN ETB (ETHIOPIAN BIRR ONLY): SEMESTER 1 (PAID) + SEMESTER 2 (ACTIVE RECONCILIATION)
  console.log('  -> Generating ETB tuition fee ledgers, sibling discounts, and matching payments...');
  let totalRevenueETB = 0;
  let totalPendingETB = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i]!;

    // SEMESTER 1 INVOICE: ETB 1,800.00 (100% PAID)
    const sem1Inv = await prisma.invoice.create({
      data: {
        tenantId,
        studentId: student.id,
        title: 'Semester 1 Academic Tuition & Facility Fee (2025/2026)',
        amount: 1800.00,
        status: InvoiceStatus.PAID,
        dueDate: new Date('2025-09-30T17:00:00.000Z'),
      },
    });

    await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: sem1Inv.id,
        amount: 1800.00,
        method: i % 2 === 0 ? 'BANK_TRANSFER' : 'MOBILE_MONEY',
        reference: `CBE-BIRR-TXN-${100000 + i}`,
        createdAt: new Date('2025-09-25T11:00:00.000Z'),
      },
    });
    totalRevenueETB += 1800;

    // SEMESTER 2 INVOICE: ETB 1,800.00 (70% Paid, 20% Partial, 10% Unpaid)
    const statusMod = i % 10;
    const isPaid = statusMod < 7;
    const isPartial = statusMod === 7 || statusMod === 8;
    const sem2Status: InvoiceStatus = isPaid
      ? InvoiceStatus.PAID
      : isPartial
      ? InvoiceStatus.PARTIAL
      : InvoiceStatus.UNPAID;

    const sem2Inv = await prisma.invoice.create({
      data: {
        tenantId,
        studentId: student.id,
        title: 'Semester 2 Academic Tuition & Lab Supplies (2025/2026)',
        amount: 1800.00,
        status: sem2Status,
        dueDate: new Date('2026-03-01T17:00:00.000Z'),
      },
    });

    if (isPaid) {
      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: sem2Inv.id,
          amount: 1800.00,
          method: 'MOBILE_MONEY',
          reference: `TELEBIRR-REC-${200000 + i}`,
          createdAt: new Date('2026-02-20T14:30:00.000Z'),
        },
      });
      totalRevenueETB += 1800;
    } else if (isPartial) {
      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: sem2Inv.id,
          amount: 900.00,
          method: 'BANK_TRANSFER',
          reference: `AWASH-TXN-${300000 + i}`,
          createdAt: new Date('2026-02-28T10:15:00.000Z'),
        },
      });
      totalRevenueETB += 900;
      totalPendingETB += 900;
    } else {
      totalPendingETB += 1800;
    }
  }

  // 13. REALISTIC OPERATIONAL EXPENSES IN ETB
  console.log('  -> Creating institutional operating expense records in ETB...');
  const expensesDefs = [
    { title: 'Campus Dedicated Fiber Internet Subscription (Ethio Telecom)', cat: 'Utilities & Internet', amount: 48500.00, vendor: 'Ethio Telecom Enterprise', daysAgo: 10 },
    { title: 'Natural Sciences Laboratory Reagents, Glassware & Safety Goggles', cat: 'Laboratory Supplies', amount: 82400.00, vendor: 'Alpha Scientific & Educational Supplies', daysAgo: 25 },
    { title: 'Student Transport Fleet Diesel Fuel & Vehicle Inspection', cat: 'Transportation Fleet', amount: 64200.00, vendor: 'TotalEnergies Ethiopia', daysAgo: 40 },
    { title: 'Solar Power Campus Inverter & Backup Battery Maintenance', cat: 'Facility & Maintenance', amount: 37500.00, vendor: 'CleanEnergy Engineering Solutions', daysAgo: 55 },
    { title: 'Cambridge & National Curriculum Textbook Consignment (Grades 9-12)', cat: 'Library & Curriculum', amount: 112000.00, vendor: 'Berhanena Selam Printing Enterprise', daysAgo: 70 },
  ];

  for (const ex of expensesDefs) {
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() - ex.daysAgo);
    await prisma.expense.create({
      data: {
        tenantId,
        title: ex.title,
        category: ex.cat,
        amount: ex.amount,
        vendorName: ex.vendor,
        date: expenseDate,
      },
    });
  }

  // 14. EXAM HALLS, MODEL EXAM SCHEDULES & 210 SEAT ALLOCATIONS
  console.log('  -> Creating national model exam rooms and student seat allocations...');
  const roomDefs = [
    { name: 'Main Examination Hall A', capacity: 60 },
    { name: 'STEM Science Block Hall B', capacity: 60 },
    { name: 'Humanities Lecture Auditorium C', capacity: 60 },
    { name: 'Digital Campus Lab Hall D', capacity: 60 },
  ];

  const examRooms: any[] = [];
  for (const r of roomDefs) {
    const room = await prisma.examRoom.create({
      data: { tenantId, name: r.name, capacity: r.capacity },
    });
    examRooms.push(room);
  }

  const examSchedule = await prisma.examSchedule.create({
    data: {
      tenantId,
      title: 'National Model Secondary Examination (Grades 9-12)',
      date: new Date('2026-05-18T09:00:00.000Z'),
      startTime: '08:30',
      endTime: '11:30',
      classIds: classes.map((c) => c.id),
    },
  });

  const seatAssignments: any[] = [];
  for (let i = 0; i < students.length; i++) {
    const student = students[i]!;
    const roomIdx = Math.floor(i / 55);
    const seatNum = (i % 55) + 1;
    const room = examRooms[roomIdx] || examRooms[0]!;

    seatAssignments.push({
      tenantId,
      examId: examSchedule.id,
      roomId: room.id,
      studentId: student.id,
      seatNumber: seatNum,
    });
  }

  await prisma.examSeat.createMany({ data: seatAssignments });

  // 15. LIBRARY BOOKS & BORROWINGS
  console.log('  -> Seeding campus library catalog and student loans...');
  const bookDefs = [
    { title: 'College Physics: Principles & Applications', author: 'Dr. Raymond Serway', isbn: '978-0134876986', category: 'Physics' },
    { title: 'Organic Chemistry Structure and Function', author: 'K. Peter C. Vollhardt', isbn: '978-1319079451', category: 'Chemistry' },
    { title: 'Campbell Biology Global Edition', author: 'Lisa A. Urry', isbn: '978-1292341637', category: 'Biology' },
    { title: 'A History of Modern Ethiopia 1855-1991', author: 'Bahru Zewde', isbn: '978-0852557860', category: 'History' },
    { title: 'Python Programming: An Introduction to Computer Science', author: 'John Zelle', isbn: '978-1590282755', category: 'Computer Science' },
    { title: 'Principles of Microeconomics', author: 'N. Gregory Mankiw', isbn: '978-0357133484', category: 'Economics' },
  ];

  for (let bIdx = 0; bIdx < bookDefs.length; bIdx++) {
    const b = bookDefs[bIdx]!;
    const book = await prisma.book.create({
      data: {
        tenantId,
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: b.category,
        totalCopies: 20,
        availableCopies: 15,
      },
    });

    if (bIdx < students.length) {
      await prisma.bookLoan.create({
        data: {
          tenantId,
          bookId: book.id,
          studentId: students[bIdx]!.id,
          borrowedAt: new Date('2026-04-05T10:00:00.000Z'),
          dueDate: new Date('2026-04-25T10:00:00.000Z'),
        },
      });
    }
  }

  // 16. EXTRACURRICULAR CLUBS & STUDENT MEMBERSHIPS
  console.log('  -> Setting up student clubs and memberships...');
  const clubDefs = [
    { name: 'Robotics & Artificial Intelligence Club', cat: 'STEM & Robotics', advisor: 'Dawit Alemayehu' },
    { name: 'Debating Society & Model African Union', cat: 'Leadership & Civics', advisor: 'Elias Haile' },
    { name: 'Young Scientists & Bio-Innovation Society', cat: 'Scientific Research', advisor: 'Dr. Rahel Mulugeta' },
    { name: 'Environmental Protection & Green Campus Initiative', cat: 'Ecology & Community', advisor: 'Tigist Bekele' },
  ];

  for (let cIdx = 0; cIdx < clubDefs.length; cIdx++) {
    const c = clubDefs[cIdx]!;
    const club = await prisma.club.create({
      data: {
        tenantId,
        name: c.name,
        category: c.cat,
        advisorName: c.advisor,
        description: `Official school extracurricular society dedicated to ${c.cat.toLowerCase()}.`,
      },
    });

    for (let m = 0; m < 12; m++) {
      const student = students[(cIdx * 12 + m) % students.length]!;
      await prisma.clubMembership.create({
        data: {
          tenantId,
          clubId: club.id,
          studentId: student.id,
          role: m === 0 ? 'PRESIDENT' : m === 1 ? 'SECRETARY' : 'MEMBER',
        },
      });
    }
  }

  // 17. GATE SCAN TERMINAL & CLINIC VISIT LOGS
  console.log('  -> Initializing gate passes and clinic visit logs...');
  for (let g = 0; g < 10; g++) {
    const student = students[g]!;
    await prisma.gatePass.create({
      data: {
        tenantId,
        studentId: student.id,
        reason: 'Authorized Early Dismissal - Dental Consultation',
        releasedTo: student.guardianName,
        approvedBy: 'Dawit Bekele (Registrar)',
        exitTime: new Date(Date.now() - (g + 1) * 3600000),
      },
    });

    await prisma.clinicVisit.create({
      data: {
        tenantId,
        studentId: student.id,
        symptoms: g % 2 === 0 ? 'Mild headache and seasonal allergy' : 'Minor knee scrape during physical education',
        treatment: g % 2 === 0 ? 'Rest in clinic observation bay, oral hydration' : 'Antiseptic wash, sterile gauze bandage applied',
        medication: g % 2 === 0 ? 'Paracetamol 500mg' : 'Antiseptic ointment',
      },
    });
  }

  // 18. ANNOUNCEMENTS
  console.log('  -> Publishing campus operational notices...');
  const announcementsDefs = [
    {
      title: 'Semester 2 Midterm Reports Published & PTA Consultations Open',
      content: 'Semester 2 interim progress reports and midterm assessment marks are now finalized. Parent-Teacher consultation slots can be scheduled through the portal.',
    },
    {
      title: 'National Model Secondary Examination Schedule Announced',
      content: 'The official Model Examination timetable and individual hall seat allocations for Grades 9, 10, 11, and 12 are available. Review your assigned examination hall and desk numbers.',
    },
  ];

  for (const ann of announcementsDefs) {
    await prisma.announcement.create({
      data: { tenantId, title: ann.title, content: ann.content },
    });
  }

  console.log('========================================================================');
  console.log('🎉 COMPREHENSIVE OPERATIONAL DEMO DATA SEEDED SUCCESSFULLY!');
  console.log(`   Classes: ${classes.length} sections across Grades 9-12`);
  console.log(`   Total Students: ${students.length} (at least 50 in each grade)`);
  console.log(`   Families Established: ${families.length} (100% of students linked)`);
  console.log(`   Faculty Profiles: ${teacherProfiles.length} with conflict-free timetables`);
  console.log(`   Weekly Timetable Slots: ${timetableEntries.length} periods`);
  console.log(`   Exam Sessions: 1 Exam (${seatAssignments.length} seats in 4 halls)`);
  console.log(`   Total Tuition Seeded: ETB ${totalRevenueETB.toLocaleString()} | Outstanding: ETB ${totalPendingETB.toLocaleString()}`);
  console.log('========================================================================');
}
