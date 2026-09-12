-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "observeOfficialHolidays" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "InstituteCustomOffDay" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstituteCustomOffDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstituteCustomOffDay_instituteId_idx" ON "InstituteCustomOffDay"("instituteId");

-- CreateIndex
CREATE INDEX "InstituteCustomOffDay_instituteId_date_idx" ON "InstituteCustomOffDay"("instituteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InstituteCustomOffDay_instituteId_date_key" ON "InstituteCustomOffDay"("instituteId", "date");

-- AddForeignKey
ALTER TABLE "InstituteCustomOffDay" ADD CONSTRAINT "InstituteCustomOffDay_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
