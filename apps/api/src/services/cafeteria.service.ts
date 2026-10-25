import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createMenuItem(tenantId: string, data: { name: string, price: number, category: string, allergens?: string }) {
  return prisma.menuItem.create({
    data: { tenantId, name: data.name, price: data.price, category: data.category, allergens: data.allergens },
  });
}

export async function listMenu(tenantId: string) {
  return prisma.menuItem.findMany({ where: { tenantId }, orderBy: { category: 'asc' } });
}

export async function getWallet(tenantId: string, studentId: string) {
  let wallet = await prisma.studentWallet.findUnique({
    where: { studentId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  if (!wallet) {
    // Create a wallet if it doesn't exist
    wallet = await prisma.studentWallet.create({
      data: { tenantId, studentId },
      include: { transactions: true }
    });
  }
  return wallet;
}

export async function topUpWallet(tenantId: string, studentId: string, amount: number) {
  const wallet = await getWallet(tenantId, studentId);

  return prisma.$transaction(async (tx) => {
    await tx.studentWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });

    return tx.walletTransaction.create({
      data: {
        tenantId,
        walletId: wallet.id,
        amount,
        type: 'TOPUP',
        description: 'Parent Wallet Top-up',
      },
    });
  });
}

export async function purchaseMeal(tenantId: string, admissionNumber: string, menuItemId: string) {
  const student = await prisma.student.findFirst({
    where: { tenantId, admissionNumber, deletedAt: null },
    include: { healthRecord: true, wallet: true },
  });

  if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');
  if (!student.wallet) throw new AppError('Student does not have an active wallet', 400, 'NO_WALLET');

  const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!menuItem) throw new AppError('Menu item not found', 404, 'NOT_FOUND');

  const balance = Number(student.wallet.balance);
  const price = Number(menuItem.price);

  if (balance < price) throw new AppError(`Insufficient funds. Balance: ${balance} ETB`, 400, 'INSUFFICIENT_FUNDS');

  // ALLERGY CHECK
  let allergyWarning = null;
  if (menuItem.allergens && student.healthRecord?.allergies) {
    const studentAllergies = student.healthRecord.allergies.toLowerCase();
    const itemAllergens = menuItem.allergens.toLowerCase();
    
    // Simple check to see if any of the item's allergens match the student's
    const allergensArray = itemAllergens.split(',').map(a => a.trim());
    const hasMatch = allergensArray.some(allergen => studentAllergies.includes(allergen));

    if (hasMatch) {
      allergyWarning = `⚠️ WARNING: This student is allergic to ${student.healthRecord.allergies}! This item contains ${menuItem.allergens}.`;
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.studentWallet.update({
      where: { id: student.wallet!.id },
      data: { balance: { decrement: price } },
    });

    await tx.walletTransaction.create({
      data: {
        tenantId,
        walletId: student.wallet!.id,
        amount: price,
        type: 'PURCHASE',
        description: `Bought ${menuItem.name}`,
      },
    });

    return {
      success: true,
      studentName: `${student.firstName} ${student.lastName}`,
      newBalance: balance - price,
      allergyWarning,
    };
  });
}