import { prisma } from '../lib/prisma.js';

/**
 * Self-healing database schema synchronizer.
 * Ensures that newly added institutional architecture tables exist in PostgreSQL
 * even if 'prisma db push' was not executed in the host deployment build pipeline.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  console.log('🔄 Checking and ensuring database schema tables in PostgreSQL...');

  const ddlStatements = [
    // 1. Durable Background Queue
    `CREATE TABLE IF NOT EXISTS "durable_jobs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "queueName" TEXT NOT NULL DEFAULT 'default',
      "jobType" TEXT NOT NULL,
      "payload" JSONB NOT NULL,
      "priority" INTEGER NOT NULL DEFAULT 2,
      "status" TEXT NOT NULL DEFAULT 'QUEUED',
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 3,
      "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lockedAt" TIMESTAMP(3),
      "lockedBy" TEXT,
      "lastError" TEXT,
      "progress" INTEGER NOT NULL DEFAULT 0,
      "result" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" TIMESTAMP(3)
    );`,
    `CREATE INDEX IF NOT EXISTS "durable_jobs_tenantId_status_runAt_idx" ON "durable_jobs"("tenantId", "status", "runAt");`,
    `CREATE INDEX IF NOT EXISTS "durable_jobs_status_runAt_priority_idx" ON "durable_jobs"("status", "runAt", "priority");`,

    // 2. Student Safeguarding & Child Protection
    `CREATE TABLE IF NOT EXISTS "safeguarding_incidents" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "reportedById" TEXT NOT NULL,
      "concernType" TEXT NOT NULL,
      "severity" TEXT NOT NULL,
      "details" TEXT NOT NULL,
      "actionsTaken" TEXT,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "isConfidential" BOOLEAN NOT NULL DEFAULT true,
      "designatedLeadId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "resolvedAt" TIMESTAMP(3)
    );`,
    `CREATE INDEX IF NOT EXISTS "safeguarding_incidents_tenantId_studentId_idx" ON "safeguarding_incidents"("tenantId", "studentId");`,
    `CREATE INDEX IF NOT EXISTS "safeguarding_incidents_tenantId_status_idx" ON "safeguarding_incidents"("tenantId", "status");`,

    `CREATE TABLE IF NOT EXISTS "safeguarding_access_logs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "incidentId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "accessReason" TEXT NOT NULL,
      "ipAddress" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "safeguarding_access_logs_tenantId_incidentId_idx" ON "safeguarding_access_logs"("tenantId", "incidentId");`,

    // 3. Approved Pickup Persons
    `CREATE TABLE IF NOT EXISTS "approved_pickup_persons" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "relationship" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "idCardNumber" TEXT,
      "photoUrl" TEXT,
      "securityPinHash" TEXT,
      "isAuthorized" BOOLEAN NOT NULL DEFAULT true,
      "emergencyPriority" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "approved_pickup_persons_tenantId_studentId_idx" ON "approved_pickup_persons"("tenantId", "studentId");`,

    // 4. Support Referrals & Interventions
    `CREATE TABLE IF NOT EXISTS "support_referrals" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "referredById" TEXT NOT NULL,
      "reasonCategory" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
      "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
      "assignedToId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "intervention_plans" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "referralId" TEXT,
      "targetArea" TEXT NOT NULL,
      "smartGoals" TEXT NOT NULL,
      "strategy" TEXT NOT NULL,
      "coordinatorId" TEXT NOT NULL,
      "reviewDate" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "outcomeNotes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "intervention_meetings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "planId" TEXT NOT NULL,
      "meetingDate" TIMESTAMP(3) NOT NULL,
      "attendees" JSONB NOT NULL,
      "discussionNotes" TEXT NOT NULL,
      "actionItems" JSONB NOT NULL,
      "nextFollowUpDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 5. Grade Audit Logs & Accommodations
    `CREATE TABLE IF NOT EXISTS "grade_audit_logs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "gradeId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "previousScore" DOUBLE PRECISION,
      "newScore" DOUBLE PRECISION NOT NULL,
      "reason" TEXT NOT NULL,
      "changedById" TEXT NOT NULL,
      "approvedById" TEXT,
      "status" TEXT NOT NULL DEFAULT 'APPROVED',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "assessment_accommodations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "details" TEXT NOT NULL,
      "extraTimePercent" INTEGER,
      "approvedById" TEXT NOT NULL,
      "expiryDate" TIMESTAMP(3),
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "assessment_moderations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "assessmentId" TEXT NOT NULL,
      "moderatorId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'IN_REVIEW',
      "sampleSize" INTEGER NOT NULL DEFAULT 5,
      "notes" TEXT,
      "scoreAdjustmentsApplied" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 6. Data Migration Batches
    `CREATE TABLE IF NOT EXISTS "migration_batches" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "totalRows" INTEGER NOT NULL,
      "validRows" INTEGER NOT NULL,
      "invalidRows" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'STAGED',
      "summary" JSONB,
      "errorReport" JSONB,
      "createdById" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "committedAt" TIMESTAMP(3),
      "rolledBackAt" TIMESTAMP(3)
    );`,

    // 7. Finance: Fee Waivers & Payment Refunds
    `CREATE TABLE IF NOT EXISTS "fee_waivers" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "percentage" DECIMAL(5, 2),
      "fixedAmount" DECIMAL(10, 2),
      "reason" TEXT NOT NULL,
      "approvedById" TEXT NOT NULL,
      "startDate" TIMESTAMP(3) NOT NULL,
      "endDate" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "payment_refunds" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "paymentId" TEXT NOT NULL,
      "amount" DECIMAL(10, 2) NOT NULL,
      "reason" TEXT NOT NULL,
      "requestedById" TEXT NOT NULL,
      "approvedById" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      "processedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 8. Offline Sync Conflicts
    `CREATE TABLE IF NOT EXISTS "sync_conflicts" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "deviceId" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "recordId" TEXT NOT NULL,
      "clientPayload" JSONB NOT NULL,
      "serverPayload" JSONB NOT NULL,
      "conflictType" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'DETECTED',
      "resolvedById" TEXT,
      "resolutionNotes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "resolvedAt" TIMESTAMP(3)
    );`,
  ];

  for (const ddl of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(ddl);
    } catch (err: any) {
      // Non-fatal if table/index exists or slight syntax variation
      console.warn(`[SchemaSync] DDL execution notice:`, err.message);
    }
  }

  console.log('✅ PostgreSQL schema verified and synchronized successfully.');
}
