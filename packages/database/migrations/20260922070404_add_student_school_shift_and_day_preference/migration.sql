-- CreateEnum
CREATE TYPE "StudentSchoolShift" AS ENUM ('MORNING', 'AFTERNOON', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "StudentDayPreference" AS ENUM ('EVEN_DAYS', 'ODD_DAYS', 'ANY');

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "dayPreference" "StudentDayPreference" NOT NULL DEFAULT 'ANY',
ADD COLUMN     "schoolShift" "StudentSchoolShift" NOT NULL DEFAULT 'FLEXIBLE';

-- CreateIndex
CREATE INDEX "StudentProfile_schoolShift_idx" ON "StudentProfile"("schoolShift");

-- CreateIndex
CREATE INDEX "StudentProfile_dayPreference_idx" ON "StudentProfile"("dayPreference");
