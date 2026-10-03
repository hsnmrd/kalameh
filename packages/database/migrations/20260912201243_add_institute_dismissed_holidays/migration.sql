-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "dismissedHolidays" TEXT[] DEFAULT ARRAY[]::TEXT[];
