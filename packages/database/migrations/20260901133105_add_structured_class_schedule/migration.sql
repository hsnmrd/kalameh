-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT;
