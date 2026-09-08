-- CreateEnum
CREATE TYPE "ClassDeliveryMode" AS ENUM ('IN_PERSON', 'ONLINE');

-- CreateTable
CREATE TABLE "ClassRequirement" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "branchId" TEXT,
    "requiredClassCount" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "sessionDurationMinutes" INTEGER NOT NULL,
    "sessionsPerWeek" INTEGER,
    "totalSessions" INTEGER,
    "deliveryMode" "ClassDeliveryMode" NOT NULL DEFAULT 'IN_PERSON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassRequirement_instituteId_idx" ON "ClassRequirement"("instituteId");

-- CreateIndex
CREATE INDEX "ClassRequirement_termId_idx" ON "ClassRequirement"("termId");

-- CreateIndex
CREATE INDEX "ClassRequirement_courseId_idx" ON "ClassRequirement"("courseId");

-- CreateIndex
CREATE INDEX "ClassRequirement_branchId_idx" ON "ClassRequirement"("branchId");

-- CreateIndex
CREATE INDEX "ClassRequirement_instituteId_termId_isActive_idx" ON "ClassRequirement"("instituteId", "termId", "isActive");

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
