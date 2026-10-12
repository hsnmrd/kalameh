-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "classId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_transactionId_key" ON "Enrollment"("transactionId");

-- CreateIndex
CREATE INDEX "Transaction_classId_idx" ON "Transaction"("classId");

-- CreateIndex
CREATE INDEX "Transaction_instituteId_trackingCode_idx" ON "Transaction"("instituteId", "trackingCode");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
