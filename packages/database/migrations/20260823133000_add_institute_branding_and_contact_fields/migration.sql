-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "phones" TEXT[] DEFAULT ARRAY[]::TEXT[];
