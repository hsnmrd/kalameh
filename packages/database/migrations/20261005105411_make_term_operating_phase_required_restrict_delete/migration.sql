/*
  Warnings:

  - Made the column `operatingPhaseId` on table `Term` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Term" DROP CONSTRAINT "Term_operatingPhaseId_fkey";

-- AlterTable
ALTER TABLE "Term" ALTER COLUMN "operatingPhaseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_operatingPhaseId_fkey" FOREIGN KEY ("operatingPhaseId") REFERENCES "InstituteOperatingPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
