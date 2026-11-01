import { PrismaClient, Gender, InvoiceStatus, AttendanceStatus, UserStatus, UserTenantStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedOperationalData(prisma: PrismaClient, tenantId: string, roleMap?: Record<string, string>) {
  console.log('⚡ Populating rich operational data for tenant:', tenantId);

  // 1. CLEAN EXISTING OPERATIONAL DATA FOR THIS TENANT
  console.log('  -> Purging old demo operational records...');
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

  // 2. CREATE 6 ACADEMIC CLASSES
  console.log('  -> Creating academic classes & sections...');
  const classDefs = [
    { name: 'Grade 9', section: 'A', capacity: 35 },
    { name: 'Grade 9', section: 'B', capacity: 35 },
    { name: 'Grade 10', section: 'A', capacity: 35 },
    { name: 'Grade 10', section: 'B', capacity: 35 },
    { name: 'Grade 11', section: 'Natural Science', capacity: 35 },
    { name: 'Grade 12', section: 'Advanced STEM', capacity: 35 },
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

  // 3. CREATE 10 CORE & ADVANCED SUBJECTS
  console.log('  -> Creating school subjects...');
  const subjectDefs = [
    { name: 'Mathematics & Calculus', code: 'MATH-101' },
    { name: 'Advanced Physics', code: 'PHYS-201' },
    { name: 'Organic & General Chemistry', code: 'CHEM-202' },
    { name: 'Biology & Life Sciences', code: 'BIO-105' },
    { name: 'English Language & World Literature', code: 'ENG-101' },
    { name: 'Computer Science & Python Programming', code: 'CS-101' },
    { name: 'World History & Global Citizenship', code: 'HIST-102' },
    { name: 'Economics & Financial Literacy', code: 'ECON-201' },
    { name: 'Physical Education & Athletics', code: 'PE-101' },
    { name: 'Fine Arts & Creative Media', code: 'ART-101' },
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

  // 4. FIND OR CREATE TEACHERS WITH TEACHERPROFILES
  console.log('  -> Creating faculty profiles & teachers...');
  let teacherRole = await prisma.role.findFirst({ where: { slug: 'TEACHER' } });
  const teacherRoleId = roleMap?.['TEACHER'] || teacherRole?.id;

  const teacherDefs = [
    { email: 'teacher@demo-school.local', firstName: 'Abebe', lastName: 'Kebede', gender: Gender.MALE, title: 'Senior Mathematics Faculty', employeeId: 'FAC-MATH-01', spec: 'Pure Mathematics & Calculus', qual: 'M.Sc. Applied Mathematics' },
    { email: 'rahel.mulugeta@demo-school.local', firstName: 'Dr. Rahel', lastName: 'Mulugeta', gender: Gender.FEMALE, title: 'Head of Chemistry', employeeId: 'FAC-CHEM-02', spec: 'Organic & Inorganic Chemistry', qual: 'Ph.D. Chemical Sciences' },
    { email: 'yohannes.desta@demo-school.local', firstName: 'Yohannes', lastName: 'Desta', gender: Gender.MALE, title: 'Physics Department Lead', employeeId: 'FAC-PHYS-03', spec: 'Theoretical & Classical Physics', qual: 'M.Sc. Physics' },
    { email: 'tigist.bekele@demo-school.local', firstName: 'Tigist', lastName: 'Bekele', gender: Gender.FEMALE, title: 'Biology Instructor', employeeId: 'FAC-BIO-04', spec: 'Cell Biology & Genetics', qual: 'B.Ed. Life Sciences' },
    { email: 'elias.haile@demo-school.local', firstName: 'Elias', lastName: 'Haile', gender: Gender.MALE, title: 'Social Studies & Civics', employeeId: 'FAC-HIST-05', spec: 'Modern World History & Civics', qual: 'M.A. History' },
    { email: 'bethlehem.tsegaye@demo-school.local', firstName: 'Bethlehem', lastName: 'Tsegaye', gender: Gender.FEMALE, title: 'Literature & Linguistics', employeeId: 'FAC-ENG-06', spec: 'English & Modern Literature', qual: 'M.A. English' },
    { email: 'dawit.alemayehu@demo-school.local', firstName: 'Dawit', lastName: 'Alemayehu', gender: Gender.MALE, title: 'ICT & Robotics Lead', employeeId: 'FAC-CS-07', spec: 'Software Engineering & Coding', qual: 'B.Sc. Computer Science' },
    { email: 'meron.assefa@demo-school.local', firstName: 'Meron', lastName: 'Assefa', gender: Gender.FEMALE, title: 'Economics Teacher', employeeId: 'FAC-ECON-08', spec: 'Micro & Macroeconomics', qual: 'M.Sc. Economics' },
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
          baseSalary: 18500,
        },
      });
    }
    teacherProfiles.push(tp);
  }

  // 5. CREATE 48 REALISTIC STUDENTS DISTRIBUTED ACROSS ALL CLASSES
  console.log('  -> Creating 48 students across all grade levels...');
  const studentPool = [
    // Grade 9-A
    { classIdx: 0, firstName: 'Natnael', lastName: 'Mulugeta', gender: Gender.MALE, dob: '2011-03-14', guardian: 'Mulugeta Tesfaye', phone: '+251-911-304050' },
    { classIdx: 0, firstName: 'Bethlehem', lastName: 'Assefa', gender: Gender.FEMALE, dob: '2011-05-19', guardian: 'Assefa Wolde', phone: '+251-912-112233' },
    { classIdx: 0, firstName: 'Kirubel', lastName: 'Tekle', gender: Gender.MALE, dob: '2011-02-10', guardian: 'Tekle Berhe', phone: '+251-913-223344' },
    { classIdx: 0, firstName: 'Mahlet', lastName: 'Kassahun', gender: Gender.FEMALE, dob: '2011-07-25', guardian: 'Kassahun Desta', phone: '+251-914-334455' },
    { classIdx: 0, firstName: 'Brook', lastName: 'Alemu', gender: Gender.MALE, dob: '2011-01-30', guardian: 'Alemu Tilahun', phone: '+251-915-445566' },
    { classIdx: 0, firstName: 'Tsion', lastName: 'Girma', gender: Gender.FEMALE, dob: '2011-08-12', guardian: 'Girma Negash', phone: '+251-916-556677' },
    { classIdx: 0, firstName: 'Abel', lastName: 'Fikru', gender: Gender.MALE, dob: '2011-11-04', guardian: 'Fikru Abebe', phone: '+251-917-667788' },
    { classIdx: 0, firstName: 'Hana', lastName: 'Worku', gender: Gender.FEMALE, dob: '2011-09-22', guardian: 'Worku Sisay', phone: '+251-918-778899' },

    // Grade 9-B
    { classIdx: 1, firstName: 'Liya', lastName: 'Kebede', gender: Gender.FEMALE, dob: '2011-04-18', guardian: 'Kebede Desta', phone: '+251-911-889900' },
    { classIdx: 1, firstName: 'Samuel', lastName: 'Yohannes', gender: Gender.MALE, dob: '2011-06-08', guardian: 'Yohannes Bekele', phone: '+251-912-990011' },
    { classIdx: 1, firstName: 'Betelhem', lastName: 'Tefera', gender: Gender.FEMALE, dob: '2011-10-15', guardian: 'Tefera Haile', phone: '+251-913-102030' },
    { classIdx: 1, firstName: 'Daniel', lastName: 'Negash', gender: Gender.MALE, dob: '2011-03-29', guardian: 'Negash Wolde', phone: '+251-914-203040' },
    { classIdx: 1, firstName: 'Hanna', lastName: 'Berhanu', gender: Gender.FEMALE, dob: '2011-12-05', guardian: 'Berhanu Tadesse', phone: '+251-915-304050' },
    { classIdx: 1, firstName: 'Mikiyas', lastName: 'Dagne', gender: Gender.MALE, dob: '2011-07-17', guardian: 'Dagne Melaku', phone: '+251-916-405060' },
    { classIdx: 1, firstName: 'Senait', lastName: 'Mekonnen', gender: Gender.FEMALE, dob: '2011-08-28', guardian: 'Mekonnen Girma', phone: '+251-917-506070' },
    { classIdx: 1, firstName: 'Biniyam', lastName: 'Zewde', gender: Gender.MALE, dob: '2011-02-14', guardian: 'Zewde Bekele', phone: '+251-918-607080' },

    // Grade 10-A (Includes demo student Almaz Hailu and Selamawit Mulugeta)
    { classIdx: 2, firstName: 'Almaz', lastName: 'Hailu', gender: Gender.FEMALE, dob: '2010-04-12', guardian: 'Mulugeta Tesfaye', phone: '+251-911-234567' },
    { classIdx: 2, firstName: 'Selamawit', lastName: 'Mulugeta', gender: Gender.FEMALE, dob: '2010-08-22', guardian: 'Mulugeta Tesfaye', phone: '+251-911-234567' },
    { classIdx: 2, firstName: 'Yared', lastName: 'Tadesse', gender: Gender.MALE, dob: '2010-05-30', guardian: 'Tadesse Alemu', phone: '+251-912-345678' },
    { classIdx: 2, firstName: 'Fasika', lastName: 'Desta', gender: Gender.FEMALE, dob: '2010-01-18', guardian: 'Desta Kebede', phone: '+251-913-456789' },
    { classIdx: 2, firstName: 'Robel', lastName: 'Haile', gender: Gender.MALE, dob: '2010-09-09', guardian: 'Haile Berhe', phone: '+251-914-567890' },
    { classIdx: 2, firstName: 'Meron', lastName: 'Worku', gender: Gender.FEMALE, dob: '2010-11-27', guardian: 'Worku Mengistu', phone: '+251-915-678901' },
    { classIdx: 2, firstName: 'Eyob', lastName: 'Solomon', gender: Gender.MALE, dob: '2010-03-03', guardian: 'Solomon Dagne', phone: '+251-916-789012' },
    { classIdx: 2, firstName: 'Helina', lastName: 'Mengistu', gender: Gender.FEMALE, dob: '2010-07-14', guardian: 'Mengistu Tekle', phone: '+251-917-890123' },

    // Grade 10-B
    { classIdx: 3, firstName: 'Hermela', lastName: 'Fantahun', gender: Gender.FEMALE, dob: '2010-06-19', guardian: 'Fantahun Girma', phone: '+251-911-123456' },
    { classIdx: 3, firstName: 'Nahom', lastName: 'Gashaw', gender: Gender.MALE, dob: '2010-02-24', guardian: 'Gashaw Tadesse', phone: '+251-912-234567' },
    { classIdx: 3, firstName: 'Kalkidan', lastName: 'Eshetu', gender: Gender.FEMALE, dob: '2010-10-11', guardian: 'Eshetu Bekele', phone: '+251-913-345678' },
    { classIdx: 3, firstName: 'Bereket', lastName: 'Wolde', gender: Gender.MALE, dob: '2010-04-05', guardian: 'Wolde Fikru', phone: '+251-914-456789' },
    { classIdx: 3, firstName: 'Rahel', lastName: 'Tilahun', gender: Gender.FEMALE, dob: '2010-12-30', guardian: 'Tilahun Abebe', phone: '+251-915-567890' },
    { classIdx: 3, firstName: 'Surafel', lastName: 'Mulatu', gender: Gender.MALE, dob: '2010-08-16', guardian: 'Mulatu Haile', phone: '+251-916-678901' },
    { classIdx: 3, firstName: 'Eden', lastName: 'Getachew', gender: Gender.FEMALE, dob: '2010-03-21', guardian: 'Getachew Desta', phone: '+251-917-789012' },
    { classIdx: 3, firstName: 'Yonatan', lastName: 'Abebe', gender: Gender.MALE, dob: '2010-07-09', guardian: 'Abebe Zewde', phone: '+251-918-890123' },

    // Grade 11-Science
    { classIdx: 4, firstName: 'Feven', lastName: 'Legesse', gender: Gender.FEMALE, dob: '2009-05-14', guardian: 'Legesse Tsegaye', phone: '+251-911-987654' },
    { classIdx: 4, firstName: 'Henok', lastName: 'Gebre', gender: Gender.MALE, dob: '2009-09-28', guardian: 'Gebre Sisay', phone: '+251-912-876543' },
    { classIdx: 4, firstName: 'Saron', lastName: 'Wondimu', gender: Gender.FEMALE, dob: '2009-01-17', guardian: 'Wondimu Dagne', phone: '+251-913-765432' },
    { classIdx: 4, firstName: 'Biruk', lastName: 'Kassa', gender: Gender.MALE, dob: '2009-11-03', guardian: 'Kassa Melaku', phone: '+251-914-654321' },
    { classIdx: 4, firstName: 'Hiwot', lastName: 'Melaku', gender: Gender.FEMALE, dob: '2009-04-20', guardian: 'Melaku Berhanu', phone: '+251-915-543210' },
    { classIdx: 4, firstName: 'Leul', lastName: 'Mengesha', gender: Gender.MALE, dob: '2009-08-11', guardian: 'Mengesha Wolde', phone: '+251-916-432109' },
    { classIdx: 4, firstName: 'Ruth', lastName: 'Sisay', gender: Gender.FEMALE, dob: '2009-03-09', guardian: 'Sisay Fikru', phone: '+251-917-321098' },
    { classIdx: 4, firstName: 'Fitsum', lastName: 'Demissie', gender: Gender.MALE, dob: '2009-12-25', guardian: 'Demissie Tadesse', phone: '+251-918-210987' },

    // Grade 12-STEM
    { classIdx: 5, firstName: 'Natnael', lastName: 'Girma', gender: Gender.MALE, dob: '2008-04-10', guardian: 'Girma Assefa', phone: '+251-911-345678' },
    { classIdx: 5, firstName: 'Tsion', lastName: 'Assefa', gender: Gender.FEMALE, dob: '2008-08-15', guardian: 'Assefa Desta', phone: '+251-912-456789' },
    { classIdx: 5, firstName: 'Michael', lastName: 'Tadesse', gender: Gender.MALE, dob: '2008-02-28', guardian: 'Tadesse Haile', phone: '+251-913-567890' },
    { classIdx: 5, firstName: 'Bezawit', lastName: 'Hailu', gender: Gender.FEMALE, dob: '2008-10-07', guardian: 'Hailu Bekele', phone: '+251-914-678901' },
    { classIdx: 5, firstName: 'Amanuel', lastName: 'Desta', gender: Gender.MALE, dob: '2008-06-22', guardian: 'Desta Wolde', phone: '+251-915-789012' },
    { classIdx: 5, firstName: 'Blen', lastName: 'Kebede', gender: Gender.FEMALE, dob: '2008-12-01', guardian: 'Kebede Tilahun', phone: '+251-916-890123' },
    { classIdx: 5, firstName: 'Yohannes', lastName: 'Worku', gender: Gender.MALE, dob: '2008-03-18', guardian: 'Worku Melaku', phone: '+251-917-901234' },
    { classIdx: 5, firstName: 'Maya', lastName: 'Solomon', gender: Gender.FEMALE, dob: '2008-07-29', guardian: 'Solomon Zewde', phone: '+251-918-012345' },
  ];

  const students: any[] = [];
  for (let i = 0; i < studentPool.length; i++) {
    const s = studentPool[i]!;
    const assignedClass = classes[s.classIdx];
    const admissionNumber = `SMS-2026-${String(i + 1).padStart(3, '0')}`;

    const student = await prisma.student.create({
      data: {
        tenantId,
        admissionNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: new Date(s.dob),
        classId: assignedClass?.id,
        guardianName: s.guardian,
        guardianPhone: s.phone,
      },
    });
    students.push(student);
  }

  // 6. CONNECT DEMO PARENT (Mulugeta Tesfaye) TO HIS CHILDREN
  console.log('  -> Connecting demo parent profile...');
  const parentUser = await prisma.user.findUnique({ where: { email: 'parent@demo-school.local' } });
  if (parentUser) {
    let parentProf = await prisma.parentProfile.findUnique({ where: { userId: parentUser.id } });
    if (!parentProf) {
      parentProf = await prisma.parentProfile.create({
        data: {
          tenantId,
          userId: parentUser.id,
          occupation: 'Senior Structural Engineer',
          address: 'Bole Medhanealem, Addis Ababa',
        },
      });
    }

    // Link Mulugeta to his children in the school:
    // Natnael Mulugeta (Grade 9A), Almaz Hailu (Grade 10A), Selamawit Mulugeta (Grade 10A)
    const childrenToLink = students.filter(
      (st) => (st.firstName === 'Almaz' && st.lastName === 'Hailu') ||
              (st.firstName === 'Natnael' && st.lastName === 'Mulugeta') ||
              (st.firstName === 'Selamawit' && st.lastName === 'Mulugeta')
    );

    for (const child of childrenToLink) {
      await prisma.parentStudent.create({
        data: {
          parentId: parentProf.id,
          studentId: child.id,
          relationship: 'FATHER',
        },
      });
    }
  }

  // 7. CREATE INVOICES, PAYMENTS & 6 MONTHS OF FINANCIAL CHARTS
  console.log('  -> Generating finance records, invoices, and payment trends...');
  const monthsAgo = [5, 4, 3, 2, 1, 0];
  const paymentMethods = ['BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT_CARD', 'CASH'];

  let totalRevenueSeed = 0;
  let pendingAmountSeed = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i]!;

    // Invoice 1: Term 1 Tuition Fee ($1,250)
    const tuitionStatus: InvoiceStatus = i % 4 === 0 ? InvoiceStatus.UNPAID : (i % 5 === 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.PAID);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (tuitionStatus === InvoiceStatus.PAID ? -20 : 15));

    const invoice1 = await prisma.invoice.create({
      data: {
        tenantId,
        studentId: student.id,
        title: 'Term 1 Core Tuition & Academic Program',
        amount: 1250.00,
        status: tuitionStatus,
        dueDate,
      },
    });

    if (tuitionStatus === InvoiceStatus.PAID) {
      const monthOffset = monthsAgo[i % monthsAgo.length]!;
      const payDate = new Date();
      payDate.setMonth(payDate.getMonth() - monthOffset);
      payDate.setDate(Math.min(28, (i * 3) % 25 + 1));

      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice1.id,
          amount: 1250.00,
          method: paymentMethods[i % paymentMethods.length]!,
          reference: `TXN-${paymentMethods[i % paymentMethods.length]!.slice(0, 3)}-${10000 + i * 17}`,
          createdAt: payDate,
        },
      });
      totalRevenueSeed += 1250;
    } else if (tuitionStatus === InvoiceStatus.PARTIAL) {
      const payDate = new Date();
      payDate.setDate(payDate.getDate() - 10);
      await prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice1.id,
          amount: 600.00,
          method: 'MOBILE_MONEY',
          reference: `TXN-TELEBIRR-${20000 + i * 29}`,
          createdAt: payDate,
        },
      });
      totalRevenueSeed += 600;
      pendingAmountSeed += 650;
    } else {
      pendingAmountSeed += 1250;
    }

    // Invoice 2: STEM Laboratory & Digital Campus Fee ($350)
    if (i % 2 === 0) {
      const isPaid = i % 3 !== 0;
      const invoice2 = await prisma.invoice.create({
        data: {
          tenantId,
          studentId: student.id,
          title: 'STEM Laboratory & Computer Science Lab Fee',
          amount: 350.00,
          status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
          dueDate: new Date(Date.now() + 10 * 86400000),
        },
      });

      if (isPaid) {
        const monthOffset = monthsAgo[(i + 1) % monthsAgo.length]!;
        const payDate = new Date();
        payDate.setMonth(payDate.getMonth() - monthOffset);
        payDate.setDate(12);

        await prisma.payment.create({
          data: {
            tenantId,
            invoiceId: invoice2.id,
            amount: 350.00,
            method: paymentMethods[(i + 1) % paymentMethods.length]!,
            reference: `TXN-LAB-${30000 + i * 11}`,
            createdAt: payDate,
          },
        });
        totalRevenueSeed += 350;
      } else {
        pendingAmountSeed += 350;
      }
    }
  }

  // 8. REALISTIC EXPENSES FOR FINANCE METRICS
  console.log('  -> Creating operational expense logs...');
  const expensesDefs = [
    { title: 'High-Speed Campus Dedicated Optical Fiber', cat: 'Utilities & Internet', amount: 1850.00, vendor: 'Ethio Telecom Enterprise', daysAgo: 10 },
    { title: 'Advanced Science Lab Chemical Reagents & Glassware', cat: 'Laboratory Supplies', amount: 3450.00, vendor: 'Alpha Scientific Equipment', daysAgo: 25 },
    { title: 'Faculty Professional STEM Training Workshop', cat: 'Staff Development', amount: 2800.00, vendor: 'Global Educators Institute', daysAgo: 45 },
    { title: 'Solar Power Inverter & Battery Bank Servicing', cat: 'Facility & Maintenance', amount: 4200.00, vendor: 'CleanEnergy Solutions', daysAgo: 60 },
    { title: 'Fleet Transport Diesel & Bus Quarterly Service', cat: 'Transportation Fleet', amount: 3600.00, vendor: 'TotalEnergies Fleet', daysAgo: 75 },
    { title: 'New Senior STEM & Cambridge Textbook Consignment', cat: 'Library & Curriculum', amount: 2950.00, vendor: 'Academic Book Publishers', daysAgo: 90 },
    { title: 'Athletics & Sports Field Maintenance Equipment', cat: 'Campus Grounds', amount: 1750.00, vendor: 'SportMaster Ltd', daysAgo: 110 },
    { title: 'Cafeteria Fresh Organic Produce & Nutritional Program', cat: 'Cafeteria Operations', amount: 4100.00, vendor: 'Valley Green Farm Suppliers', daysAgo: 130 },
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

  // 9. RECENT ATTENDANCE RECORDS (Last 5 Weekdays)
  console.log('  -> Generating daily attendance records across classes...');
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const attDate = new Date();
    attDate.setDate(attDate.getDate() - dayOffset);
    // Skip weekends
    if (attDate.getDay() === 0 || attDate.getDay() === 6) continue;

    for (const student of students) {
      if (!student.classId) continue;
      // 94% present, 4% late, 2% absent
      const rand = Math.random();
      const status: AttendanceStatus = rand > 0.06 ? AttendanceStatus.PRESENT : (rand > 0.02 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT);
      const remarks = status === AttendanceStatus.LATE ? 'School bus delayed in morning traffic' : (status === AttendanceStatus.ABSENT ? 'Excused medical rest' : undefined);

      await prisma.attendance.create({
        data: {
          tenantId,
          studentId: student.id,
          classId: student.classId,
          date: attDate,
          status,
        },
      });
    }
  }

  // 10. ASSESSMENTS AND GRADES
  console.log('  -> Creating term assessments and student score sheets...');
  for (const cls of classes) {
    const assessment1 = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Midterm Comprehensive Assessment',
        maxScore: 100,
        date: new Date(Date.now() - 14 * 86400000),
      },
    });

    const assessment2 = await prisma.assessment.create({
      data: {
        tenantId,
        classId: cls.id,
        title: 'Practical Laboratory & Quiz 1',
        maxScore: 50,
        date: new Date(Date.now() - 5 * 86400000),
      },
    });

    // Score students in this class
    const classStudents = students.filter((s) => s.classId === cls.id);
    for (const st of classStudents) {
      const score1 = Math.floor(Math.random() * 25) + 75; // 75-100
      const score2 = Math.floor(Math.random() * 12) + 38; // 38-50

      await prisma.grade.create({
        data: {
          tenantId,
          assessmentId: assessment1.id,
          studentId: st.id,
          score: score1,
        },
      });

      await prisma.grade.create({
        data: {
          tenantId,
          assessmentId: assessment2.id,
          studentId: st.id,
          score: score2,
        },
      });
    }
  }

  // 11. TIMETABLE SCHEDULE
  console.log('  -> Creating weekly classroom timetables...');
  const days = [1, 2, 3, 4, 5]; // Mon - Fri
  const periods = [
    { start: '08:30', end: '09:20' },
    { start: '09:30', end: '10:20' },
    { start: '10:40', end: '11:30' },
    { start: '11:40', end: '12:30' },
    { start: '13:30', end: '14:20' },
    { start: '14:30', end: '15:20' },
  ];

  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx]!;
    for (let d = 0; d < 3; d++) {
      const day = days[d]!;
      for (let p = 0; p < 3; p++) {
        const period = periods[p]!;
        const subject = subjects[(cIdx + p) % subjects.length]!;
        const teacher = teacherProfiles[(cIdx + p) % teacherProfiles.length]!;

        await prisma.timetable.create({
          data: {
            tenantId,
            classId: cls.id,
            subjectId: subject.id,
            teacherId: teacher.id,
            dayOfWeek: day,
            startTime: period.start,
            endTime: period.end,
          },
        });
      }
    }
  }

  // 12. OFFICIAL SCHOOL ANNOUNCEMENTS
  console.log('  -> Publishing campus announcements...');
  const announcementsDefs = [
    {
      title: 'First Term Midterm Examination Schedule & Guidelines',
      content: 'The official Midterm Examination timetable for all grades has been published. Parents and students are advised to review the subject periods and classroom seat assignments.',
    },
    {
      title: 'Annual Inter-School STEM & Robotics Fair 2026',
      content: 'Demo Excellence Academy will host the regional inter-school STEM exhibition on November 28. Student project submissions in Robotics, Coding, and Bio-Chemistry are now open.',
    },
    {
      title: 'Parent-Teacher Association (PTA) Conference Confirmed',
      content: 'The Term 1 Parent-Teacher Conference is scheduled for this upcoming Saturday from 9:00 AM to 3:30 PM. One-on-one consultation slots can be booked through the parent portal.',
    },
    {
      title: 'High-Speed Campus Library Digital E-Book Catalog Launched',
      content: 'We have updated our library resource center with 1,200+ new digital books, scientific publications, and curriculum reference manuals accessible via student accounts.',
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

  console.log('🎉 Operational data seeding complete!');
  console.log(`   Classes: ${classes.length} | Subjects: ${subjects.length} | Teachers: ${teacherProfiles.length} | Students: ${students.length}`);
  console.log(`   Revenue Seeded: $${totalRevenueSeed.toLocaleString()} | Pending Receivables: $${pendingAmountSeed.toLocaleString()}`);
}
