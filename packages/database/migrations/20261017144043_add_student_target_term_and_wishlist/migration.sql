-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "inWishlist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetTermId" TEXT;

-- CreateIndex
CREATE INDEX "StudentProfile_targetTermId_idx" ON "StudentProfile"("targetTermId");

-- CreateIndex
CREATE INDEX "StudentProfile_inWishlist_idx" ON "StudentProfile"("inWishlist");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_targetTermId_fkey" FOREIGN KEY ("targetTermId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
