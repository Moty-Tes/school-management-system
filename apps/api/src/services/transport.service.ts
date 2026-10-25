import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createRoute(tenantId: string, data: any) {
  return prisma.transportRoute.create({ data: { tenantId, ...data } });
}

export async function createVehicle(tenantId: string, data: any) {
  return prisma.vehicle.create({ data: { tenantId, ...data } });
}

export async function assignStudent(tenantId: string, data: { studentId: string, routeId: string, vehicleId: string, pickupStop: string }) {
  return prisma.$transaction(async (tx) => {
    // 1. Check vehicle capacity
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');

    const currentAssigned = await tx.transportAssignment.count({ where: { vehicleId: data.vehicleId } });
    if (currentAssigned >= vehicle.capacity) {
      throw new AppError('This vehicle is already full!', 400, 'VEHICLE_FULL');
    }

    // 2. Check if student is already assigned (Upsert logic)
    const existing = await tx.transportAssignment.findUnique({ where: { studentId: data.studentId } });
    if (existing) {
      return tx.transportAssignment.update({
        where: { id: existing.id },
        data: { routeId: data.routeId, vehicleId: data.vehicleId, pickupStop: data.pickupStop }
      });
    }

    // 3. Create new assignment
    return tx.transportAssignment.create({
      data: { tenantId, ...data },
    });
  });
}

export async function getTransportData(tenantId: string) {
  const [routes, vehicles, assignments] = await Promise.all([
    prisma.transportRoute.findMany({ where: { tenantId } }),
    prisma.vehicle.findMany({ where: { tenantId } }),
    prisma.transportAssignment.findMany({
      where: { tenantId },
      include: { student: true, route: true, vehicle: true }
    })
  ]);
  return { routes, vehicles, assignments };
}