-- CreateEnum
CREATE TYPE "SchedulingRunStatus" AS ENUM ('QUEUED', 'PREFLIGHT_FAILED', 'GENERATING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SchedulingPlanStatus" AS ENUM ('DRAFT', 'SELECTED', 'PUBLISHED', 'REJECTED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "SchedulingRun" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "branchId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "sourceRunId" TEXT,
    "status" "SchedulingRunStatus" NOT NULL DEFAULT 'QUEUED',
    "inputSnapshot" JSONB NOT NULL,
    "settingsSnapshot" JSONB NOT NULL,
    "preflightReport" JSONB,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulingPlan" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" "SchedulingPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "rank" INTEGER NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "earnedWeightedPoints" DOUBLE PRECISION NOT NULL,
    "applicableWeightedPoints" DOUBLE PRECISION NOT NULL,
    "qualityIndex" DOUBLE PRECISION,
    "coveragePercent" DOUBLE PRECISION,
    "minimumCourseCoveragePercent" DOUBLE PRECISION,
    "scoreBreakdown" JSONB NOT NULL,
    "metricsSnapshot" JSONB NOT NULL,
    "weightsSnapshot" JSONB NOT NULL,
    "timeGroupsSnapshot" JSONB NOT NULL,
    "dataCompletenessSnapshot" JSONB NOT NULL,
    "warnings" JSONB,
    "formulaVersion" TEXT NOT NULL,
    "manualEditCount" INTEGER NOT NULL DEFAULT 0,
    "firstReviewStartedAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulingProposal" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "classRequirementId" TEXT,
    "courseId" TEXT NOT NULL,
    "branchId" TEXT,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT,
    "teacherQualificationId" TEXT,
    "publishedClassId" TEXT,
    "title" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "deliveryMode" "ClassDeliveryMode" NOT NULL,
    "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timeGroup" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedByUserId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "isManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulingProposalSession" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingProposalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulingUnresolvedRequirement" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "classRequirementId" TEXT,
    "reasonCode" TEXT NOT NULL,
    "missingClassCount" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingUnresolvedRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchedulingRun_instituteId_idx" ON "SchedulingRun"("instituteId");

-- CreateIndex
CREATE INDEX "SchedulingRun_termId_idx" ON "SchedulingRun"("termId");

-- CreateIndex
CREATE INDEX "SchedulingRun_branchId_idx" ON "SchedulingRun"("branchId");

-- CreateIndex
CREATE INDEX "SchedulingRun_requestedByUserId_idx" ON "SchedulingRun"("requestedByUserId");

-- CreateIndex
CREATE INDEX "SchedulingRun_sourceRunId_idx" ON "SchedulingRun"("sourceRunId");

-- CreateIndex
CREATE INDEX "SchedulingRun_instituteId_status_createdAt_idx" ON "SchedulingRun"("instituteId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SchedulingPlan_instituteId_idx" ON "SchedulingPlan"("instituteId");

-- CreateIndex
CREATE INDEX "SchedulingPlan_runId_idx" ON "SchedulingPlan"("runId");

-- CreateIndex
CREATE INDEX "SchedulingPlan_instituteId_status_createdAt_idx" ON "SchedulingPlan"("instituteId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingPlan_runId_rank_key" ON "SchedulingPlan"("runId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingProposal_publishedClassId_key" ON "SchedulingProposal"("publishedClassId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_instituteId_idx" ON "SchedulingProposal"("instituteId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_planId_idx" ON "SchedulingProposal"("planId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_classRequirementId_idx" ON "SchedulingProposal"("classRequirementId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_courseId_idx" ON "SchedulingProposal"("courseId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_branchId_idx" ON "SchedulingProposal"("branchId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_teacherId_idx" ON "SchedulingProposal"("teacherId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_classroomId_idx" ON "SchedulingProposal"("classroomId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_lockedByUserId_idx" ON "SchedulingProposal"("lockedByUserId");

-- CreateIndex
CREATE INDEX "SchedulingProposal_planId_isLocked_idx" ON "SchedulingProposal"("planId", "isLocked");

-- CreateIndex
CREATE INDEX "SchedulingProposalSession_instituteId_idx" ON "SchedulingProposalSession"("instituteId");

-- CreateIndex
CREATE INDEX "SchedulingProposalSession_planId_sessionDate_idx" ON "SchedulingProposalSession"("planId", "sessionDate");

-- CreateIndex
CREATE INDEX "SchedulingProposalSession_proposalId_idx" ON "SchedulingProposalSession"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingProposalSession_proposalId_sessionDate_startTime_key" ON "SchedulingProposalSession"("proposalId", "sessionDate", "startTime");

-- CreateIndex
CREATE INDEX "SchedulingUnresolvedRequirement_instituteId_idx" ON "SchedulingUnresolvedRequirement"("instituteId");

-- CreateIndex
CREATE INDEX "SchedulingUnresolvedRequirement_planId_idx" ON "SchedulingUnresolvedRequirement"("planId");

-- CreateIndex
CREATE INDEX "SchedulingUnresolvedRequirement_classRequirementId_idx" ON "SchedulingUnresolvedRequirement"("classRequirementId");

-- CreateIndex
CREATE INDEX "SchedulingUnresolvedRequirement_planId_reasonCode_idx" ON "SchedulingUnresolvedRequirement"("planId", "reasonCode");

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "SchedulingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingPlan" ADD CONSTRAINT "SchedulingPlan_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingPlan" ADD CONSTRAINT "SchedulingPlan_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SchedulingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SchedulingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_classRequirementId_fkey" FOREIGN KEY ("classRequirementId") REFERENCES "ClassRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_publishedClassId_fkey" FOREIGN KEY ("publishedClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposalSession" ADD CONSTRAINT "SchedulingProposalSession_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposalSession" ADD CONSTRAINT "SchedulingProposalSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SchedulingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposalSession" ADD CONSTRAINT "SchedulingProposalSession_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "SchedulingProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingUnresolvedRequirement" ADD CONSTRAINT "SchedulingUnresolvedRequirement_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingUnresolvedRequirement" ADD CONSTRAINT "SchedulingUnresolvedRequirement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SchedulingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingUnresolvedRequirement" ADD CONSTRAINT "SchedulingUnresolvedRequirement_classRequirementId_fkey" FOREIGN KEY ("classRequirementId") REFERENCES "ClassRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
