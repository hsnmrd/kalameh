-- CreateEnum
CREATE TYPE "StudentScheduleStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "StudentTimeConstraintKind" AS ENUM ('UNAVAILABLE', 'PREFERRED');

-- CreateEnum
CREATE TYPE "StudentTimeConstraintSource" AS ENUM ('SCHOOL', 'UNIVERSITY', 'WORK', 'PERSONAL', 'OTHER');

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "scheduleStatus" "StudentScheduleStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- CreateTable
CREATE TABLE "StudentTimeConstraint" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "kind" "StudentTimeConstraintKind" NOT NULL,
    "source" "StudentTimeConstraintSource" NOT NULL DEFAULT 'OTHER',
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "label" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTimeConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentTimeConstraint_instituteId_idx" ON "StudentTimeConstraint"("instituteId");

-- CreateIndex
CREATE INDEX "StudentTimeConstraint_studentProfileId_idx" ON "StudentTimeConstraint"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentTimeConstraint_studentProfileId_kind_idx" ON "StudentTimeConstraint"("studentProfileId", "kind");

-- CreateIndex
CREATE INDEX "StudentTimeConstraint_studentProfileId_effectiveFrom_effect_idx" ON "StudentTimeConstraint"("studentProfileId", "effectiveFrom", "effectiveUntil");

-- AddForeignKey
ALTER TABLE "StudentTimeConstraint" ADD CONSTRAINT "StudentTimeConstraint_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTimeConstraint" ADD CONSTRAINT "StudentTimeConstraint_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
