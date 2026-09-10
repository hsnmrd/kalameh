-- AlterTable
ALTER TABLE "InstituteOperatingPhase" ADD COLUMN     "breakEndTime" TEXT,
ADD COLUMN     "breakStartTime" TEXT,
ADD COLUMN     "hasBreak" BOOLEAN NOT NULL DEFAULT false;
