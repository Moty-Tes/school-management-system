import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createClub(tenantId: string, data: any) {
  return prisma.club.create({
    data: { tenantId, ...data },
  });
}

export async function listClubs(tenantId: string) {
  return prisma.club.findMany({
    where: { tenantId },
    include: { _count: { select: { memberships: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getClubMembers(tenantId: string, clubId: string) {
  return prisma.clubMembership.findMany({
    where: { tenantId, clubId },
    include: { student: { include: { class: true } } },
    orderBy: { student: { firstName: 'asc' } },
  });
}

export async function addMember(tenantId: string, clubId: string, studentId: string, role: string = 'MEMBER') {
  const existing = await prisma.clubMembership.findUnique({
    where: { clubId_studentId: { clubId, studentId } }
  });
  if (existing) throw new AppError('Student is already in this club', 400, 'ALREADY_MEMBER');

  return prisma.clubMembership.create({
    data: { tenantId, clubId, studentId, role },
    include: { student: true }
  });
}

export async function removeMember(tenantId: string, membershipId: string) {
  return prisma.clubMembership.delete({
    where: { id: membershipId, tenantId },
  });
}

export async function getStudentClubs(tenantId: string, studentId: string) {
  return prisma.clubMembership.findMany({
    where: { tenantId, studentId },
    include: { club: true },
  });
}