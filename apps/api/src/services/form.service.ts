import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createForm(tenantId: string, data: { title: string, description?: string, schema: any[] }) {
  return prisma.form.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description,
      schema: data.schema,
    },
  });
}

export async function listForms(tenantId: string) {
  return prisma.form.findMany({
    where: { tenantId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getForm(tenantId: string, formId: string) {
  return prisma.form.findFirst({
    where: { id: formId, tenantId },
  });
}

export async function submitForm(tenantId: string, formId: string, userId: string, data: Record<string, any>) {
  const form = await prisma.form.findFirst({ where: { id: formId, tenantId, isActive: true } });
  if (!form) throw new AppError('Form not found or inactive', 404, 'NOT_FOUND');

  // Check if user already submitted
  const existing = await prisma.formSubmission.findUnique({
    where: { formId_userId: { formId, userId } }
  });

  if (existing) {
    // Allow updating the submission if they made a mistake
    return prisma.formSubmission.update({
      where: { id: existing.id },
      data: { data },
    });
  }

  return prisma.formSubmission.create({
    data: { tenantId, formId, userId, data },
  });
}

export async function getSubmissions(tenantId: string, formId: string) {
  return prisma.formSubmission.findMany({
    where: { tenantId, formId },
    include: { user: { select: { profile: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function toggleFormStatus(tenantId: string, formId: string, isActive: boolean) {
  return prisma.form.update({
    where: { id: formId, tenantId },
    data: { isActive },
  });
}