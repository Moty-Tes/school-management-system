import { prisma } from '../lib/prisma.js';

export async function getMyChildren(tenantId: string, userId: string) {
  const parentProfile = await prisma.parentProfile.findFirst({
    where: { tenantId, userId },
    include: {
      students: {
        include: {
          student: {
            include: { class: true } // Bring in their grade/section
          }
        }
      }
    }
  });

  if (!parentProfile) return [];

  // Map it to return a clean array of student objects
  return parentProfile.students.map(link => link.student);
}