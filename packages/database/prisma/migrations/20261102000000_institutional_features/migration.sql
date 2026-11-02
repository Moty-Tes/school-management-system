-- Institutional Features Migration: Safeguarding, Interventions, Durable Queue, Governance, Migrations, Finance Reversals
-- Migration ID: 20261102000000_institutional_features

-- 1. Durable Background Queue
CREATE TABLE IF NOT EXISTS "durable_jobs" (
    "id" TEXT NOT NULL,
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
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "durable_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "durable_jobs_tenantId_status_runAt_idx" ON "durable_jobs"("tenantId", "status", "runAt");
CREATE INDEX IF NOT EXISTS "durable_jobs_status_runAt_priority_idx" ON "durable_jobs"("status", "runAt", "priority");

-- 2. Student Safeguarding & Child Protection
CREATE TABLE IF NOT EXISTS "safeguarding_incidents" (
    "id" TEXT NOT NULL,
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
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "safeguarding_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "safeguarding_incidents_tenantId_studentId_idx" ON "safeguarding_incidents"("tenantId", "studentId");
CREATE INDEX IF NOT EXISTS "safeguarding_incidents_tenantId_status_idx" ON "safeguarding_incidents"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "safeguarding_access_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "accessReason" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safeguarding_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "safeguarding_access_logs_tenantId_incidentId_idx" ON "safeguarding_access_logs"("tenantId", "incidentId");
CREATE INDEX IF NOT EXISTS "safeguarding_access_logs_tenantId_userId_idx" ON "safeguarding_access_logs"("tenantId", "userId");

-- 3. Approved Pickup Persons
CREATE TABLE IF NOT EXISTS "approved_pickup_persons" (
    "id" TEXT NOT NULL,
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
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approved_pickup_persons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "approved_pickup_persons_tenantId_studentId_idx" ON "approved_pickup_persons"("tenantId", "studentId");

-- 4. Support Referrals & Interventions
CREATE TABLE IF NOT EXISTS "support_referrals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "referredById" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT NOT NULL,
    "baselineData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_referrals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_referrals_tenantId_studentId_idx" ON "support_referrals"("tenantId", "studentId");
CREATE INDEX IF NOT EXISTS "support_referrals_tenantId_status_idx" ON "support_referrals"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "intervention_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "referralId" TEXT,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetOutcomes" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "aiRecommendationSource" TEXT,
    "staffSignedById" TEXT NOT NULL,
    "staffSignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "intervention_plans_tenantId_studentId_idx" ON "intervention_plans"("tenantId", "studentId");
CREATE INDEX IF NOT EXISTS "intervention_plans_tenantId_status_idx" ON "intervention_plans"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "intervention_plans_tenantId_reviewDate_idx" ON "intervention_plans"("tenantId", "reviewDate");

CREATE TABLE IF NOT EXISTS "intervention_meetings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "attendees" JSONB NOT NULL,
    "minutes" TEXT NOT NULL,
    "outcomeNotes" TEXT NOT NULL,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_meetings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "intervention_meetings_tenantId_planId_idx" ON "intervention_meetings"("tenantId", "planId");

-- 5. Grade Audit Logs & Accommodations
CREATE TABLE IF NOT EXISTS "grade_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "previousScore" DOUBLE PRECISION NOT NULL,
    "newScore" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "grade_audit_logs_tenantId_gradeId_idx" ON "grade_audit_logs"("tenantId", "gradeId");
CREATE INDEX IF NOT EXISTS "grade_audit_logs_tenantId_studentId_idx" ON "grade_audit_logs"("tenantId", "studentId");

CREATE TABLE IF NOT EXISTS "assessment_accommodations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "extraTimePercent" INTEGER NOT NULL DEFAULT 25,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedById" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_accommodations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "assessment_accommodations_tenantId_studentId_idx" ON "assessment_accommodations"("tenantId", "studentId");

CREATE TABLE IF NOT EXISTS "assessment_moderations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "moderatedById" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "scoreAdjustmentsApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_moderations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "assessment_moderations_tenantId_assessmentId_idx" ON "assessment_moderations"("tenantId", "assessmentId");

-- 6. Data Migration Batches
CREATE TABLE IF NOT EXISTS "migration_batches" (
    "id" TEXT NOT NULL,
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
    "rolledBackAt" TIMESTAMP(3),

    CONSTRAINT "migration_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "migration_batches_tenantId_status_idx" ON "migration_batches"("tenantId", "status");

-- 7. Finance: Fee Waivers & Payment Refunds
CREATE TABLE IF NOT EXISTS "fee_waivers" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_waivers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fee_waivers_tenantId_studentId_idx" ON "fee_waivers"("tenantId", "studentId");

CREATE TABLE IF NOT EXISTS "payment_refunds" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payment_refunds_tenantId_paymentId_idx" ON "payment_refunds"("tenantId", "paymentId");

-- 8. Offline Sync Conflicts
CREATE TABLE IF NOT EXISTS "sync_conflicts" (
    "id" TEXT NOT NULL,
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
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sync_conflicts_tenantId_status_idx" ON "sync_conflicts"("tenantId", "status");

-- Foreign Key Constraints (Idempotent execution via DO block)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'durable_jobs_tenantId_fkey') THEN
        ALTER TABLE "durable_jobs" ADD CONSTRAINT "durable_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'safeguarding_incidents_tenantId_fkey') THEN
        ALTER TABLE "safeguarding_incidents" ADD CONSTRAINT "safeguarding_incidents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'safeguarding_incidents_studentId_fkey') THEN
        ALTER TABLE "safeguarding_incidents" ADD CONSTRAINT "safeguarding_incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'safeguarding_access_logs_tenantId_fkey') THEN
        ALTER TABLE "safeguarding_access_logs" ADD CONSTRAINT "safeguarding_access_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'safeguarding_access_logs_incidentId_fkey') THEN
        ALTER TABLE "safeguarding_access_logs" ADD CONSTRAINT "safeguarding_access_logs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "safeguarding_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approved_pickup_persons_tenantId_fkey') THEN
        ALTER TABLE "approved_pickup_persons" ADD CONSTRAINT "approved_pickup_persons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approved_pickup_persons_studentId_fkey') THEN
        ALTER TABLE "approved_pickup_persons" ADD CONSTRAINT "approved_pickup_persons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_referrals_tenantId_fkey') THEN
        ALTER TABLE "support_referrals" ADD CONSTRAINT "support_referrals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_referrals_studentId_fkey') THEN
        ALTER TABLE "support_referrals" ADD CONSTRAINT "support_referrals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_plans_tenantId_fkey') THEN
        ALTER TABLE "intervention_plans" ADD CONSTRAINT "intervention_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_plans_studentId_fkey') THEN
        ALTER TABLE "intervention_plans" ADD CONSTRAINT "intervention_plans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_plans_referralId_fkey') THEN
        ALTER TABLE "intervention_plans" ADD CONSTRAINT "intervention_plans_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "support_referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_meetings_tenantId_fkey') THEN
        ALTER TABLE "intervention_meetings" ADD CONSTRAINT "intervention_meetings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_meetings_planId_fkey') THEN
        ALTER TABLE "intervention_meetings" ADD CONSTRAINT "intervention_meetings_planId_fkey" FOREIGN KEY ("planId") REFERENCES "intervention_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grade_audit_logs_tenantId_fkey') THEN
        ALTER TABLE "grade_audit_logs" ADD CONSTRAINT "grade_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grade_audit_logs_gradeId_fkey') THEN
        ALTER TABLE "grade_audit_logs" ADD CONSTRAINT "grade_audit_logs_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grade_audit_logs_studentId_fkey') THEN
        ALTER TABLE "grade_audit_logs" ADD CONSTRAINT "grade_audit_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_accommodations_tenantId_fkey') THEN
        ALTER TABLE "assessment_accommodations" ADD CONSTRAINT "assessment_accommodations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_accommodations_studentId_fkey') THEN
        ALTER TABLE "assessment_accommodations" ADD CONSTRAINT "assessment_accommodations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_moderations_tenantId_fkey') THEN
        ALTER TABLE "assessment_moderations" ADD CONSTRAINT "assessment_moderations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_moderations_assessmentId_fkey') THEN
        ALTER TABLE "assessment_moderations" ADD CONSTRAINT "assessment_moderations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'migration_batches_tenantId_fkey') THEN
        ALTER TABLE "migration_batches" ADD CONSTRAINT "migration_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_waivers_tenantId_fkey') THEN
        ALTER TABLE "fee_waivers" ADD CONSTRAINT "fee_waivers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_waivers_studentId_fkey') THEN
        ALTER TABLE "fee_waivers" ADD CONSTRAINT "fee_waivers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_tenantId_fkey') THEN
        ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_paymentId_fkey') THEN
        ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_conflicts_tenantId_fkey') THEN
        ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
