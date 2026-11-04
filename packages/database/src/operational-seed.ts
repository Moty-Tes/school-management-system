import { PrismaClient, Gender, InvoiceStatus, AttendanceStatus, UserStatus, UserTenantStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // 2. PURGE OLD DEMO OPERATIONAL RECORDS (Safely scoped to this demo tenantId)
  console.log('  -> Purging old demo operational records...');
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
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.expense.deleteMany({ where: { tenantId } });
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

  // 3. CREATE 4 ACADEMIC CLASSES (Grades 9, 10, 11 Natural Science, 12 Social Science)
  console.log('  -> Creating 4 core academic classes & sections (50 students each)...');
  const classDefs = [
    { name: 'Grade 9', section: 'A (Common Foundation)', capacity: 55 },
    { name: 'Grade 10', section: 'A (Common Foundation)', capacity: 55 },
    { name: 'Grade 11', section: 'Section A (Natural Science Stream)', capacity: 55 },
    { name: 'Grade 12', section: 'Section A (Social Science Stream)', capacity: 55 },
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
    classes.push(created);
  }

  // 4. CREATE ETHIOPIAN CURRICULUM SUBJECTS (Common + Streams)
  console.log('  -> Creating Ethiopian curriculum subjects...');
  const subjectDefs = [
    // Common Foundation (Grades 9 & 10)
    { name: 'Mathematics & Algebra', code: 'MATH-091' },
    { name: 'English Language & Literature', code: 'ENG-091' },
    { name: 'Information Technology & Coding', code: 'IT-091' },
    { name: 'Biology & Life Sciences', code: 'BIO-091' },
    { name: 'Chemistry & Lab Sciences', code: 'CHEM-091' },
    { name: 'Physics & Applied Mechanics', code: 'PHYS-091' },
    { name: 'Ethiopian & World History', code: 'HIST-091' },
    { name: 'Geography & Environmental Systems', code: 'GEOG-091' },
    { name: 'Economics & Financial Fundamentals', code: 'ECON-091' },
    { name: 'Civics & Ethical Studies', code: 'CIV-091' },

    // Advanced Natural Science Stream (Grades 11 & 12)
    { name: 'Advanced Calculus & Analytical Geometry', code: 'MATH-111' },
    { name: 'Cellular & Molecular Biology', code: 'BIO-111' },
    { name: 'Organic & Physical Chemistry', code: 'CHEM-111' },
    { name: 'Electromagnetism & Thermodynamics', code: 'PHYS-111' },

    // Social Science Stream (Grades 11 & 12)
    { name: 'Macroeconomics & Development Studies', code: 'ECON-121' },
    { name: 'Contemporary African & Global History', code: 'HIST-121' },
    { name: 'Human Geography & Spatial Planning', code: 'GEOG-121' },
  ];

  const subjects: any[] = [];
  for (const s of subjectDefs) {
    const created = await prisma.subject.create({
      data: {
        tenantId,
        name: s.name,
        code: s.code,
      },
    });
    subjects.push(created);
  }

  // 5. CREATE FACULTY PROFILES & DEPARTMENT HEADS (Scoped by Grade Band)
  console.log('  -> Setting up faculty instructors and department heads...');
  let teacherRole = await prisma.role.findFirst({ where: { slug: 'TEACHER' } });
  const teacherRoleId = roleMap?.['TEACHER'] || teacherRole?.id;

  const teacherDefs = [
    { email: 'teacher@demo-school.local', firstName: 'Abebe', lastName: 'Kebede', gender: Gender.MALE, title: 'Senior Mathematics Faculty & Dept Head (9-12)', employeeId: 'FAC-MATH-01', spec: 'Pure Mathematics & Calculus', qual: 'M.Sc. Mathematics' },
    { email: 'rahel.mulugeta@demo-school.local', firstName: 'Dr. Rahel', lastName: 'Mulugeta', gender: Gender.FEMALE, title: 'Head of Chemistry & Natural Sciences', employeeId: 'FAC-CHEM-02', spec: 'Organic & Inorganic Chemistry', qual: 'Ph.D. Chemistry' },
    { email: 'yohannes.desta@demo-school.local', firstName: 'Yohannes', lastName: 'Desta', gender: Gender.MALE, title: 'Physics Department Lead', employeeId: 'FAC-PHYS-03', spec: 'Theoretical & Applied Physics', qual: 'M.Sc. Physics' },
    { email: 'tigist.bekele@demo-school.local', firstName: 'Tigist', lastName: 'Bekele', gender: Gender.FEMALE, title: 'Biology Instructor', employeeId: 'FAC-BIO-04', spec: 'Genetics & Life Sciences', qual: 'B.Ed. Biology' },
    { email: 'elias.haile@demo-school.local', firstName: 'Elias', lastName: 'Haile', gender: Gender.MALE, title: 'Social Sciences & History Lead', employeeId: 'FAC-HIST-05', spec: 'Ethiopian & Modern History', qual: 'M.A. History' },
    { email: 'bethlehem.tsegaye@demo-school.local', firstName: 'Bethlehem', lastName: 'Tsegaye', gender: Gender.FEMALE, title: 'English & Literature Department Lead', employeeId: 'FAC-ENG-06', spec: 'English Language & Linguistics', qual: 'M.A. English' },
    { email: 'dawit.alemayehu@demo-school.local', firstName: 'Dawit', lastName: 'Alemayehu', gender: Gender.MALE, title: 'ICT & Computer Science Faculty', employeeId: 'FAC-CS-07', spec: 'Software Systems & Python', qual: 'B.Sc. Computer Science' },
    { email: 'meron.assefa@demo-school.local', firstName: 'Meron', lastName: 'Assefa', gender: Gender.FEMALE, title: 'Economics & Commercial Studies', employeeId: 'FAC-ECON-08', spec: 'Micro & Macroeconomics', qual: 'M.Sc. Economics' },
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
              locale: 'en',
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
          baseSalary: 21500,
        },
      });
    }
    teacherProfiles.push(tp);
  }

  // 6. GENERATE 200 SYNTHETIC STUDENTS (EXACTLY 50 PER CLASS)
  console.log('  -> Generating 200 synthetic student records (50 per class)...');
  const students: any[] = [];
  let globalStudentCounter = 1;

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    const cls = classes[classIndex]!;
    // Age distribution: Gr 9 = 2011, Gr 10 = 2010, Gr 11 = 2009, Gr 12 = 2008
    const birthYear = 2011 - classIndex;

    for (let sIdx = 0; sIdx < 50; sIdx++) {
      const isMale = (globalStudentCounter % 2) === 1;
      const firstName = isMale
        ? MALE_FIRST_NAMES[sIdx % MALE_FIRST_NAMES.length]!
        : FEMALE_FIRST_NAMES[sIdx % FEMALE_FIRST_NAMES.length]!;

      // Determine father/guardian name
      const fatherName = FATHER_NAMES[(sIdx + classIndex * 7) % FATHER_NAMES.length]!;
      const admissionNumber = `SMS-2026-${String(globalStudentCounter).padStart(3, '0')}`;
      const birthMonth = String((sIdx % 12) + 1).padStart(2, '0');
      const birthDay = String((sIdx % 28) + 1).padStart(2, '0');
      const dateOfBirth = new Date(`${birthYear}-${birthMonth}-${birthDay}T00:00:00.000Z`);

      // Deterministic synthetic avatar URL (no scraped or real human images)
      const photoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=DEMO-${admissionNumber}`;

      // Default guardian contact info
      const guardianName = `${fatherName} Tesfaye`;
      const guardianPhone = `+251-911-${String(100000 + globalStudentCounter).slice(1)}`;

      const student = await prisma.student.create({
        data: {
          tenantId,
          admissionNumber,
          firstName,
          lastName: fatherName,
          gender: isMale ? Gender.MALE : Gender.FEMALE,
          dateOfBirth,
          classId: cls.id,
          guardianName,
          guardianPhone,
          photoUrl,
        },
      });

      students.push(student);
      globalStudentCounter++;
    }
  }

  console.log(`  ✓ Successfully created ${students.length} students across 4 classes.`);

  // 7. EXPLICIT MULTI-CHILD SIBLING FAMILY RECORDS
  console.log('  -> Establishing multi-child family records & guardian accounts...');
  let parentRole = await prisma.role.findFirst({ where: { slug: 'PARENT' } });
  const parentRoleId = roleMap?.['PARENT'] || parentRole?.id;

  const parentDefs = [
    {
      email: 'parent@demo-school.local',
      firstName: 'Mulugeta',
      lastName: 'Tesfaye',
      occupation: 'Senior Civil Engineer',
      address: 'Bole Subcity, Woreda 03, Addis Ababa',
      phone: '+251-911-304050',
      // Children: Student 1 (Gr 9), Student 51 (Gr 10), Student 101 (Gr 11)
      childIndices: [0, 50, 100],
      relationship: 'FATHER',
    },
    {
      email: 'aster.bekele@demo-school.local',
      firstName: 'Aster',
      lastName: 'Bekele',
      occupation: 'Public Health Specialist',
      address: 'Yeka Subcity, Megenagna, Addis Ababa',
      phone: '+251-912-112233',
      // Children: Student 2 (Gr 9), Student 52 (Gr 10)
      childIndices: [1, 51],
      relationship: 'MOTHER',
    },
    {
      email: 'tadesse.alemu@demo-school.local',
      firstName: 'Tadesse',
      lastName: 'Alemu',
      occupation: 'Commercial Banker',
      address: 'Kirkos Subcity, Kazanchis, Addis Ababa',
      phone: '+251-913-223344',
      // Children: Student 3 (Gr 9), Student 53 (Gr 10), Student 102 (Gr 11)
      childIndices: [2, 52, 101],
      relationship: 'FATHER',
    },
    {
      email: 'genet.wolde@demo-school.local',
      firstName: 'Genet',
      lastName: 'Wolde',
      occupation: 'University Lecturer',
      address: 'Gullele Subcity, Addis Ababa',
      phone: '+251-914-334455',
      // Children: Student 4 (Gr 9), Student 151 (Gr 12)
      childIndices: [3, 150],
      relationship: 'MOTHER',
    },
  ];

  const parentPasswordHash = await bcrypt.hash('Parent123!', 10);

  for (const p of parentDefs) {
    let pUser = await prisma.user.findUnique({ where: { email: p.email } });
    if (!pUser) {
      pUser = await prisma.user.create({
        data: {
          email: p.email,
          passwordHash: parentPasswordHash,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
          profile: {
            create: {
              firstName: p.firstName,
              lastName: p.lastName,
              locale: 'en',
              timezone: 'Africa/Addis_Ababa',
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
          data: {
            userTenantId: ut.id,
            roleId: parentRoleId,
          },
        });
      }
    }

    let pProfile = await prisma.parentProfile.findUnique({ where: { userId: pUser.id } });
    if (!pProfile) {
      pProfile = await prisma.parentProfile.create({
        data: {
          tenantId,
          userId: pUser.id,
          occupation: p.occupation,
          address: p.address,
        },
      });
    }

    // Link sibling children
    for (const childIdx of p.childIndices) {
      const child = students[childIdx];
      if (child) {
        await prisma.parentStudent.create({
          data: {
            parentId: pProfile.id,
            studentId: child.id,
            relationship: p.relationship,
          },
        });

        // Ensure student guardian info matches the parent
        await prisma.student.update({
          where: { id: child.id },
          data: {
            guardianName: `${p.firstName} ${p.lastName}`,
            guardianPhone: p.phone,
          },
        });
      }
    }
  }

  // 8. GENERATE 5-DAY ATTENDANCE RECORDS ACROSS ALL 200 STUDENTS (1,000 Total Checkpoints)
  console.log('  -> Populating 5-day attendance registers for all 200 students...');
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const attDate = new Date();
    attDate.setDate(attDate.getDate() - dayOffset);
    if (attDate.getDay() === 0 || attDate.getDay() === 6) continue; // Skip weekends

    const attendanceBatch: any[] = [];
    for (const student of students) {
      // 94% Present, 4% Late, 2% Absent
      const rand = (student.admissionNumber.charCodeAt(student.admissionNumber.length - 1) + dayOffset * 13) % 100;
      const status: AttendanceStatus = rand > 6 ? AttendanceStatus.PRESENT : (rand > 2 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT);

      attendanceBatch.push({
        tenantId,
        studentId: student.id,
        classId: student.classId,
        date: attDate,
        status,
      });
    }

    await prisma.attendance.createMany({ data: attendanceBatch });
  }

  // 9. FINANCIAL RECORDS: TUITION INVOICES & PAYMENTS MATCHING BALANCES
  console.log('  -> Generating tuition fee ledger, invoices, and matching payment reconciliations...');
  const paymentMethods = ['BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT_CARD', 'CASH'];
  let totalSeededRevenue = 0;
  let totalPendingReceivables = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i]!;
    // Invoices distribution: 75% Paid, 15% Partial, 10% Unpaid
    const statusMod = i % 10;
    const isPaid = statusMod < 7;
    const isPartial = statusMod === 7 || statusMod === 8;
    const status: InvoiceStatus = isPaid ? InvoiceStatus.PAID : (isPartial ? InvoiceStatus.PARTIAL : InvoiceStatus.UNPAID);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (isPaid ? -15 : 20));

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        studentId: student.id,
        title: 'Semester 1 Academic Tuition & Operations',
        amount: 1200.00,
        status,
        dueDate,
      },
    });

    if (isPaid) {
      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amount: 1200.00,
          method: paymentMethods[i % paymentMethods.length]!,
          reference: `TXN-DEMO-${10000 + i}`,
          createdAt: new Date(Date.now() - (i % 30) * 86400000),
        },
      });
      totalSeededRevenue += 1200;
    } else if (isPartial) {
      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amount: 500.00,
          method: 'MOBILE_MONEY',
          reference: `TXN-TELEBIRR-DEMO-${20000 + i}`,
          createdAt: new Date(Date.now() - 5 * 86400000),
        },
      });
      totalSeededRevenue += 500;
      totalPendingReceivables += 700;
    } else {
      totalPendingReceivables += 1200;
    }
  }

  // 10. REALISTIC OPERATIONAL EXPENSES
  console.log('  -> Creating institutional expense records...');
  const expensesDefs = [
    { title: 'Campus High-Speed Dedicated Internet Bandwidth', cat: 'Utilities & Internet', amount: 2450.00, vendor: 'Ethio Telecom Enterprise', daysAgo: 5 },
    { title: 'Science Laboratory Reagents & Protective Equipment', cat: 'Laboratory Supplies', amount: 4800.00, vendor: 'Alpha Scientific Ltd', daysAgo: 18 },
    { title: 'Fleet Transport Diesel & Bus Maintenance', cat: 'Transportation Fleet', amount: 3750.00, vendor: 'TotalEnergies Fleet', daysAgo: 32 },
    { title: 'Campus Facility Solar Power Grid Inspection', cat: 'Facility & Maintenance', amount: 2900.00, vendor: 'CleanEnergy Solutions', daysAgo: 45 },
    { title: 'Curriculum Textbook Consignment (Grades 9-12)', cat: 'Library & Curriculum', amount: 5600.00, vendor: 'Academic Book Publishers', daysAgo: 60 },
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

  // 11. ASSESSMENTS AND STUDENT GRADES
  console.log('  -> Creating term assessments and grade registers...');
  for (const cls of classes) {
    const midterm = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Midterm Comprehensive Assessment',
        maxScore: 100,
        date: new Date(Date.now() - 14 * 86400000),
      },
    });

    const coursework = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Continuous Practical Coursework & Quiz',
        maxScore: 50,
        date: new Date(Date.now() - 7 * 86400000),
      },
    });

    const classStudents = students.filter((s) => s.classId === cls.id);
    for (const st of classStudents) {
      const score1 = Math.floor(Math.random() * 25) + 75; // 75 - 100
      const score2 = Math.floor(Math.random() * 12) + 38; // 38 - 50

      await prisma.grade.createMany({
        data: [
          { tenantId, assessmentId: midterm.id, studentId: st.id, score: score1 },
          { tenantId, assessmentId: coursework.id, studentId: st.id, score: score2 },
        ],
      });
    }
  }

  // 12. 5-DAY, 5-PERIOD CONFLICT-FREE TIMETABLE
  console.log('  -> Creating weekly 5-day / 5-period conflict-free timetable...');
  const daysOfWeek = [1, 2, 3, 4, 5]; // Mon, Tue, Wed, Thu, Fri
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
    for (let d = 0; d < daysOfWeek.length; d++) {
      const day = daysOfWeek[d]!;
      for (let p = 0; p < periods.length; p++) {
        const period = periods[p]!;
        // Distinct mathematical offsets prevent any teacher from being double-booked
        const subject = subjects[(cIdx * 2 + p + d) % subjects.length]!;
        const teacher = teacherProfiles[(cIdx + p * 2 + d) % teacherProfiles.length]!;

        timetableEntries.push({
          tenantId,
          classId: cls.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          dayOfWeek: day,
          startTime: period.start,
          endTime: period.end,
        });
      }
    }
  }

  await prisma.timetable.createMany({ data: timetableEntries });

  // 13. EXAM ROOMS, SCHEDULES & STUDENT SEAT ALLOCATIONS
  console.log('  -> Creating exam rooms, national model exam schedules, and seat allocations...');
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
      title: 'Semester 1 Model Examination - Mathematics & Applied Sciences',
      date: new Date(Date.now() + 14 * 86400000),
      startTime: '09:00',
      endTime: '12:00',
      classIds: classes.map((c) => c.id),
    },
  });

  const seatAssignments: any[] = [];
  for (let i = 0; i < students.length; i++) {
    const student = students[i]!;
    const roomIdx = Math.floor(i / 50);
    const seatNum = (i % 50) + 1;
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

  // 14. LIBRARY BOOKS & BORROWINGS
  console.log('  -> Seeding campus library catalog and book loans...');
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
        totalCopies: 15,
        availableCopies: 12,
      },
    });

    // Seed sample loan for the first few students
    if (bIdx < students.length) {
      await prisma.bookLoan.create({
        data: {
          tenantId,
          bookId: book.id,
          studentId: students[bIdx]!.id,
          borrowedAt: new Date(Date.now() - 7 * 86400000),
          dueDate: new Date(Date.now() + 7 * 86400000),
        },
      });
    }
  }

  // 15. EXTRACURRICULAR CLUBS & STUDENT MEMBERSHIPS
  console.log('  -> Setting up student clubs and memberships...');
  const clubDefs = [
    { name: 'Robotics & Artificial Intelligence Club', cat: 'STEM & Robotics', advisor: 'Dawit Alemayehu' },
    { name: 'Debating Society & Model African Union', cat: 'Leadership & Civics', advisor: 'Elias Haile' },
    { name: 'Young Scientists & Bio-Innovation Club', cat: 'Scientific Research', advisor: 'Dr. Rahel Mulugeta' },
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

    // Link 10 students as members
    for (let m = 0; m < 10; m++) {
      const student = students[(cIdx * 10 + m) % students.length]!;
      await prisma.clubMembership.create({
        data: {
          tenantId,
          clubId: club.id,
          studentId: student.id,
          role: m === 0 ? 'PRESIDENT' : 'MEMBER',
        },
      });
    }
  }

  // 16. GATE SCAN & ARRIVAL LOGS (Sample records)
  console.log('  -> Initializing gate pass and arrival records...');
  for (let g = 0; g < 10; g++) {
    const student = students[g]!;
    await prisma.gatePass.create({
      data: {
        tenantId,
        studentId: student.id,
        reason: 'Authorized Early Pickup - Family Dental Consultation',
        releasedTo: student.guardianName,
        approvedBy: 'Dawit Bekele (Admissions Registrar)',
        exitTime: new Date(Date.now() - (g + 1) * 3600000),
      },
    });
  }

  // 17. OFFICIAL CAMPUS ANNOUNCEMENTS
  console.log('  -> Publishing campus operational notices...');
  const announcementsDefs = [
    {
      title: 'First Semester Midterm Model Examination Schedule & Seating Plan Published',
      content: 'The official Model Examination timetable and individual hall seat allocations for Grades 9, 10, 11, and 12 are now accessible via student and parent portals. Please review your assigned examination room and desk numbers.',
    },
    {
      title: 'Annual Regional Inter-School STEM & Robotics Fair 2026',
      content: 'Demo Excellence Academy will host the regional inter-school STEM exhibition on November 28. Student project submissions in Robotics, Python Automation, and Chemistry are now open.',
    },
    {
      title: 'Parent-Teacher Association (PTA) Term 1 Conference Scheduled',
      content: 'The Term 1 Parent-Teacher Conference is scheduled for this upcoming Saturday from 9:00 AM to 3:30 PM. One-on-one consultation slots can be reserved through the parent portal.',
    },
    {
      title: 'Campus Digital Library Expansion: 1,500+ New Scientific Titles Added',
      content: 'We have updated our library resource center with 1,500+ new digital reference manuals, STEM textbooks, and Cambridge curriculum companions accessible via student accounts.',
    },
  ];

  for (const ann of announcementsDefs) {
    await prisma.announcement.create({
      data: {
        tenantId,
        title: ann.title,
        content: ann.content,
      },
    });
  }

  console.log('========================================================================');
  console.log('🎉 OPERATIONAL DEMO DATA SEEDING COMPLETE FOR DEMO ACADEMY!');
  console.log(`   Classes: ${classes.length} (4 Grades x 50 students = 200 total)`);
  console.log(`   Students Seeded: ${students.length}`);
  console.log(`   Subjects Configured: ${subjects.length}`);
  console.log(`   Faculty Profiles: ${teacherProfiles.length}`);
  console.log(`   Weekly Timetable Slots: ${timetableEntries.length} (Conflict-Free 5-Day / 5-Period)`);
  console.log(`   Exam Sessions & Seats: 1 Exam (${seatAssignments.length} seats in 4 rooms)`);
  console.log(`   Total Tuition Seeded: $${totalSeededRevenue.toLocaleString()} | Outstanding: $${totalPendingReceivables.toLocaleString()}`);
  console.log('========================================================================');
}
