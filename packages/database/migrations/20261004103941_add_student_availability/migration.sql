-- CreateTable
CREATE TABLE "StudentAvailability" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "operatingPhaseId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentAvailability_studentProfileId_idx" ON "StudentAvailability"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentAvailability_operatingPhaseId_idx" ON "StudentAvailability"("operatingPhaseId");

-- CreateIndex
CREATE INDEX "StudentAvailability_studentProfileId_operatingPhaseId_idx" ON "StudentAvailability"("studentProfileId", "operatingPhaseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAvailability_studentProfileId_operatingPhaseId_dayOf_key" ON "StudentAvailability"("studentProfileId", "operatingPhaseId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "StudentAvailability" ADD CONSTRAINT "StudentAvailability_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAvailability" ADD CONSTRAINT "StudentAvailability_operatingPhaseId_fkey" FOREIGN KEY ("operatingPhaseId") REFERENCES "InstituteOperatingPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
