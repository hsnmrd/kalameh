-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "studentSchedulesConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "studentSchedulesConfirmedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Term_studentSchedulesConfirmedByUserId_idx" ON "Term"("studentSchedulesConfirmedByUserId");

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_studentSchedulesConfirmedByUserId_fkey" FOREIGN KEY ("studentSchedulesConfirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
