-- DropForeignKey
ALTER TABLE "SchedulingProposal" DROP CONSTRAINT "SchedulingProposal_teacherId_fkey";

-- AlterTable
ALTER TABLE "SchedulingProposal" ALTER COLUMN "teacherId" DROP NOT NULL,
ALTER COLUMN "qualificationCheckedAt" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
