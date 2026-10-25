import { prisma } from '../lib/prisma.js';

// Helper to escape CSV values (handles commas and quotes inside text)
function escapeCsv(val: any) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertToCsv(headers: string[], rows: any[][]) {
  const headerLine = headers.join(',');
  const rowLines = rows.map(row => row.map(escapeCsv).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export async function exportStudents(tenantId: string) {
  const students = await prisma.student.findMany({
    where: { tenantId, deletedAt: null },
    include: { class: true },
    orderBy: { firstName: 'asc' },
  });

  const headers = ['Admission No', 'First Name', 'Last Name', 'Gender', 'Class', 'Section', 'Guardian Name', 'Guardian Phone', 'Status'];
  
  const rows = students.map(s => [
    s.admissionNumber,
    s.firstName,
    s.lastName,
    s.gender,
    s.class?.name || 'Unassigned',
    s.class?.section || '-',
    s.guardianName,
    s.guardianPhone,
    s.status
  ]);

  return convertToCsv(headers, rows);
}

export async function exportFinance(tenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: { student: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });

  const headers = ['Invoice Title', 'Student Name', 'Admission No', 'Total Amount', 'Amount Paid', 'Balance', 'Status', 'Due Date'];
  
  const rows = invoices.map(inv => {
    const total = Number(inv.amount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return [
      inv.title,
      `${inv.student.firstName} ${inv.student.lastName}`,
      inv.student.admissionNumber,
      total.toFixed(2),
      paid.toFixed(2),
      (total - paid).toFixed(2),
      inv.status,
      new Date(inv.dueDate).toLocaleDateString(),
    ];
  });

  return convertToCsv(headers, rows);
}

export async function exportAttendance(tenantId: string, dateStr: string) {
  // Fetch attendance for a specific date
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);

  const records = await prisma.attendance.findMany({
    where: { tenantId, date },
    include: { student: { include: { class: true } } },
    orderBy: { student: { firstName: 'asc' } },
  });

  const headers = ['Date', 'Student Name', 'Admission No', 'Class', 'Status'];
  
  const rows = records.map(r => [
    dateStr,
    `${r.student.firstName} ${r.student.lastName}`,
    r.student.admissionNumber,
    r.student.class ? `${r.student.class.name}-${r.student.class.section}` : 'Unassigned',
    r.status
  ]);

  return convertToCsv(headers, rows);
}