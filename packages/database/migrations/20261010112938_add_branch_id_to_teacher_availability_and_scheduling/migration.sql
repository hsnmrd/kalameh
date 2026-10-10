/*
  Warnings:

  - Made the column `branchId` on table `Class` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `ClassRequirement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `Classroom` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `SchedulingProposal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `SchedulingRun` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `branchId` to the `TeacherAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_branchId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingProposal" DROP CONSTRAINT "SchedulingProposal_branchId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingRun" DROP CONSTRAINT "SchedulingRun_branchId_fkey";

-- DropIndex
DROP INDEX "TeacherAvailability_teacherProfileId_termId_idx";

-- AlterTable
ALTER TABLE "Class" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ClassRequirement" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Classroom" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SchedulingProposal" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SchedulingRun" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeacherAvailability" ADD COLUMN     "branchId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ClassRequirement_instituteId_termId_branchId_isActive_idx" ON "ClassRequirement"("instituteId", "termId", "branchId", "isActive");

-- CreateIndex
CREATE INDEX "TeacherAvailability_branchId_idx" ON "TeacherAvailability"("branchId");

-- CreateIndex
CREATE INDEX "TeacherAvailability_teacherProfileId_termId_branchId_idx" ON "TeacherAvailability"("teacherProfileId", "termId", "branchId");

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
