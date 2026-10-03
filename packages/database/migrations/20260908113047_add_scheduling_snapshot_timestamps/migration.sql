/*
  Warnings:

  - Added the required column `qualificationCheckedAt` to the `SchedulingProposal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SchedulingPlan" ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastScoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SchedulingProposal" ADD COLUMN     "qualificationCheckedAt" TIMESTAMP(3) NOT NULL;
