-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "operatingPhaseId" TEXT;

-- CreateIndex
CREATE INDEX "Term_operatingPhaseId_idx" ON "Term"("operatingPhaseId");

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_operatingPhaseId_fkey" FOREIGN KEY ("operatingPhaseId") REFERENCES "InstituteOperatingPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
