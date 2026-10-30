import PdfPrinter from 'pdfmake';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

// Define standard fonts for pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new (PdfPrinter as any)(fonts);

// ============================================================================
// 1. REPORT CARD (Uses custom grading scale)
// ============================================================================
export async function generateReportCard(tenantId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: { class: true }
  });
  if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

  const grades = await prisma.grade.findMany({
    where: { studentId, tenantId },
    include: { assessment: true },
    orderBy: { assessment: { date: 'asc' } }
  });

  // FETCH THE ACTIVE GRADING SCALE
  const gradingScale = await prisma.gradingScale.findFirst({
    where: { tenantId, isDefault: true }
  });
  
  // Fallback if no custom scale is defined by the school
  const rules = (gradingScale?.rules as any[]) || [
    { minPercent: 90, grade: 'A' },
    { minPercent: 80, grade: 'B' },
    { minPercent: 70, grade: 'C' },
    { minPercent: 60, grade: 'D' },
    { minPercent: 0, grade: 'F' },
  ];

  let totalScore = 0;
  let totalMax = 0;
  
  const tableBody: any[] = [
    [{ text: 'Date', bold: true }, { text: 'Assessment', bold: true }, { text: 'Score', bold: true }, { text: 'Grade', bold: true }]
  ];

  grades.forEach(g => {
    const percentage = (g.score / g.assessment.maxScore) * 100;
    totalScore += g.score;
    totalMax += g.assessment.maxScore;
    
    // Find the matching grade from the rules
    const matchedRule = rules.find(r => percentage >= r.minPercent);
    const letterGrade = matchedRule ? matchedRule.grade : '-';

    tableBody.push([
      new Date(g.assessment.date).toLocaleDateString(),
      g.assessment.title,
      `${g.score} / ${g.assessment.maxScore}`,
      { text: letterGrade, bold: true, color: letterGrade === 'F' ? 'red' : 'black' }
    ]);
  });

  const average = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : '0.0';

  const docDefinition = {
    content: [
      { text: 'OFFICIAL ACADEMIC REPORT CARD', style: 'header' },
      { text: `Generated on ${new Date().toLocaleDateString()}`, style: 'subheader', alignment: 'right', margin: [0, 0, 0, 20] },
      
      { text: 'Student Information', style: 'sectionHeader' },
      {
        columns: [
          { width: '*', text: `Name: ${student.firstName} ${student.lastName}` },
          { width: '*', text: `Admission No: ${student.admissionNumber}` },
          { width: '*', text: `Class: ${student.class ? `${student.class.name} - ${student.class.section}` : 'Unassigned'}` }
        ],
        margin: [0, 0, 0, 20]
      },

      { text: 'Academic Performance', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto'],
          body: tableBody
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      {
        text: `Final Weighted Average: ${average}%`,
        style: 'summary',
        alignment: 'right'
      },
      
      { text: '\n\n_______________________', margin: [0, 30, 0, 0] },
      { text: 'Principal Signature', fontSize: 10, color: '#666' }
    ],
    styles: {
      header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
      subheader: { fontSize: 10, color: '#666' },
      sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 10], color: '#4f46e5' },
      summary: { fontSize: 14, bold: true, margin: [0, 10, 0, 0] }
    },
    defaultStyle: { fontSize: 12, color: '#333' }
  };

  return new Promise<Buffer>((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
    const chunks: any[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err) => reject(err));
    pdfDoc.end();
  });
}

// ============================================================================
// 2. ID CARD
// ============================================================================
export async function generateIdCard(tenantId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: { class: true }
  });
  if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');
const frontendUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
const verifyUrl = `${frontendUrl}/verify/${student.id}`;
const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });

  const docDefinition = {
    pageSize: { width: 242, height: 153 },
    pageMargins: [10, 10, 10, 10],
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'STUDENT IDENTIFICATION', fontSize: 8, bold: true, color: '#4f46e5', margin: [0, 0, 0, 2] },
              { text: `${student.firstName} ${student.lastName}`, fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
              { text: `ID: ${student.admissionNumber}`, fontSize: 10, color: '#333' },
              { text: `Class: ${student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}`, fontSize: 10, color: '#333', margin: [0, 2, 0, 0] },
              { text: `Gender: ${student.gender}`, fontSize: 10, color: '#333', margin: [0, 2, 0, 0] },
              { text: `Status: ${student.status}`, fontSize: 10, color: '#10b981', bold: true, margin: [0, 2, 0, 0] },
            ]
          },
          {
            width: 80,
            stack: [
              student.photoUrl ? { image: `http://localhost:4000${student.photoUrl}`, width: 60, height: 60, alignment: 'center' } : { text: '', height: 60 },
              { image: qrDataUrl, width: 50, alignment: 'center', margin: [0, 5, 0, 0] }
            ]
          }
        ]
      }
    ],
    defaultStyle: { font: 'Helvetica' }
  };

  return new Promise<Buffer>((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
    const chunks: any[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err) => reject(err));
    pdfDoc.end();
  });
}

// ============================================================================
// 3. OFFICIAL TRANSCRIPT
// ============================================================================
export async function generateTranscript(tenantId: string, studentId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: { class: true },
  });

  if (!student || !tenant) throw new AppError('Student or Tenant not found', 404, 'NOT_FOUND');

  const grades = await prisma.grade.findMany({
    where: { studentId, tenantId },
    include: { assessment: true },
    orderBy: { assessment: { date: 'asc' } },
  });

  let totalPoints = 0;
  let totalCredits = 0;
  
  const tableBody: any[] = [
    [{ text: 'Date', bold: true }, { text: 'Assessment', bold: true }, { text: 'Score', bold: true }, { text: 'Grade', bold: true }, { text: 'Points', bold: true }]
  ];

  grades.forEach(g => {
    const percentage = (g.score / g.assessment.maxScore) * 100;
    let letter = 'F';
    let points = 0.0;

    if (percentage >= 90) { letter = 'A'; points = 4.0; }
    else if (percentage >= 80) { letter = 'B'; points = 3.0; }
    else if (percentage >= 70) { letter = 'C'; points = 2.0; }
    else if (percentage >= 60) { letter = 'D'; points = 1.0; }

    totalPoints += points;
    totalCredits += 1;

    tableBody.push([
      new Date(g.assessment.date).toLocaleDateString(),
      g.assessment.title,
      `${g.score} / ${g.assessment.maxScore}`,
      letter,
      points.toFixed(1),
    ]);
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  const frontendUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify/${student.id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: tenant.name.toUpperCase(), fontSize: 20, bold: true, color: '#1e293b' },
              { text: 'OFFICIAL ACADEMIC TRANSCRIPT', fontSize: 12, bold: true, color: '#4f46e5', margin: [0, 5, 0, 0] },
              { text: `Issued on ${new Date().toLocaleDateString()}`, fontSize: 10, color: '#64748b', margin: [0, 5, 0, 0] }
            ]
          },
          { width: 80, image: qrDataUrl, alignment: 'right' }
        ]
      },
      { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 2, lineColor: '#e2e8f0' }] },
      
      { text: 'STUDENT INFORMATION', fontSize: 12, bold: true, color: '#334155', margin: [0, 20, 0, 10] },
      { columns: [{ width: '50%', text: `Name: ${student.firstName} ${student.lastName}`, fontSize: 11 }, { width: '50%', text: `Admission No: ${student.admissionNumber}`, fontSize: 11 }], margin: [0, 0, 0, 5] },
      { columns: [{ width: '50%', text: `Class: ${student.class ? `${student.class.name} - ${student.class.section}` : 'N/A'}`, fontSize: 11 }, { width: '50%', text: `Gender: ${student.gender}`, fontSize: 11 }] },

      { text: 'ACADEMIC RECORD', fontSize: 12, bold: true, color: '#334155', margin: [0, 30, 0, 10] },
      { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto'], body: tableBody }, layout: 'lightHorizontalLines' },

      { text: 'ACADEMIC SUMMARY', fontSize: 12, bold: true, color: '#334155', margin: [0, 30, 0, 10] },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [{ text: 'Total Assessments', bold: true, fillColor: '#f8fafc' }, { text: 'Total Credits', bold: true, fillColor: '#f8fafc' }, { text: 'Cumulative GPA', bold: true, fillColor: '#f8fafc' }],
            [{ text: grades.length.toString(), alignment: 'center' }, { text: totalCredits.toString(), alignment: 'center' }, { text: gpa, alignment: 'center', bold: true, color: '#4f46e5', fontSize: 14 }]
          ]
        }
      },

      {
        columns: [
          { width: '50%', stack: [{ text: '\n\n_______________________', fontSize: 10 }, { text: 'Registrar Signature', fontSize: 10, bold: true }] },
          { width: '50%', stack: [{ text: '\n\n_______________________', fontSize: 10 }, { text: 'Principal Signature', fontSize: 10, bold: true }], alignment: 'right' }
        ],
        margin: [0, 50, 0, 0]
      },
      { text: 'This is an official document. The QR code can be scanned to verify authenticity.', fontSize: 8, color: '#94a3b8', alignment: 'center', margin: [0, 40, 0, 0] }
    ],
    defaultStyle: { font: 'Helvetica' }
  };

  return new Promise<Buffer>((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
    const chunks: any[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err) => reject(err));
    pdfDoc.end();
  });
}

// ============================================================================
// 4. AWARD CERTIFICATE
// ============================================================================
export async function generateCertificatePDF(
  tenantId: string, 
  data: { studentName: string, title: string, description: string, date: string, schoolName: string, logoUrl?: string }
) {
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        table: {
          widths: ['*'],
          heights: [400],
          body: [
            [
              {
                border: [true, true, true, true],
                borderColor: ['#d4af37', '#d4af37', '#d4af37', '#d4af37'],
                borderWidth: 3,
                margin: [20, 20, 20, 20],
                stack: [
                  { text: data.schoolName.toUpperCase(), fontSize: 16, bold: true, color: '#1e293b', alignment: 'center', margin: [0, 20, 0, 0] },
                  { text: 'PROUDLY PRESENTS', fontSize: 10, color: '#64748b', alignment: 'center', margin: [0, 5, 0, 40] },
                  
                  { text: 'CERTIFICATE', fontSize: 40, bold: true, color: '#4f46e5', alignment: 'center', letterSpacing: 4 },
                  { text: data.title.toUpperCase(), fontSize: 18, bold: true, color: '#d4af37', alignment: 'center', margin: [0, 10, 0, 30] },

                  { text: 'THIS CERTIFICATE IS PROUDLY AWARDED TO', fontSize: 10, color: '#64748b', alignment: 'center', margin: [0, 0, 0, 10] },
                  { text: data.studentName, fontSize: 30, bold: true, italics: true, color: '#0f172a', alignment: 'center', margin: [0, 0, 0, 20] },
                  
                  { text: data.description, fontSize: 14, color: '#334155', alignment: 'center', margin: [0, 0, 0, 50] },

                  {
                    columns: [
                      { width: '50%', stack: [{ text: `\n\n_______________________`, fontSize: 12, alignment: 'center' }, { text: 'Principal Signature', fontSize: 10, bold: true, alignment: 'center' }] },
                      { width: '50%', stack: [{ text: `\n\n_______________________`, fontSize: 12, alignment: 'center' }, { text: `Date: ${new Date(data.date).toLocaleDateString()}`, fontSize: 10, bold: true, alignment: 'center' }] }
                    ],
                    margin: [40, 0, 40, 0]
                  }
                ]
              }
            ]
          ]
        },
        layout: { defaultBorder: false }
      }
    ],
    defaultStyle: { font: 'Helvetica' }
  };

  return new Promise<Buffer>((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
    const chunks: any[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err) => reject(err));
    pdfDoc.end();
  });
}