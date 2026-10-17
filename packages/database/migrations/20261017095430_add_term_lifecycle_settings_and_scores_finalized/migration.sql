-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "termExamDaysBeforeEnd" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "termRegistrationDaysAfterStart" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "termRegistrationDaysBeforeStart" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "scoresFinalizedAt" TIMESTAMP(3),
ADD COLUMN     "scoresFinalizedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Term_scoresFinalizedByUserId_idx" ON "Term"("scoresFinalizedByUserId");

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_scoresFinalizedByUserId_fkey" FOREIGN KEY ("scoresFinalizedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
