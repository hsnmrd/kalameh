-- CreateTable
CREATE TABLE "InstituteOperatingPhase" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "months" INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 90,
    "daysOfWeek" TEXT[] DEFAULT ARRAY['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstituteOperatingPhase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstituteOperatingPhase_instituteId_idx" ON "InstituteOperatingPhase"("instituteId");

-- CreateIndex
CREATE INDEX "InstituteOperatingPhase_instituteId_isActive_idx" ON "InstituteOperatingPhase"("instituteId", "isActive");

-- AddForeignKey
ALTER TABLE "InstituteOperatingPhase" ADD CONSTRAINT "InstituteOperatingPhase_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
