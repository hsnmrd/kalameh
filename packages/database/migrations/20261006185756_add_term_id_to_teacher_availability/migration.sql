-- AlterTable
ALTER TABLE "TeacherAvailability" ADD COLUMN     "termId" TEXT;

-- CreateIndex
CREATE INDEX "TeacherAvailability_termId_idx" ON "TeacherAvailability"("termId");

-- CreateIndex
CREATE INDEX "TeacherAvailability_teacherProfileId_termId_idx" ON "TeacherAvailability"("teacherProfileId", "termId");

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
