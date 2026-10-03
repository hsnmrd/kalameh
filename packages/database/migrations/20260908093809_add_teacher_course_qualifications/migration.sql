-- CreateTable
CREATE TABLE "TeacherCourseQualification" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCourseQualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherCourseQualification_instituteId_idx" ON "TeacherCourseQualification"("instituteId");

-- CreateIndex
CREATE INDEX "TeacherCourseQualification_teacherProfileId_idx" ON "TeacherCourseQualification"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TeacherCourseQualification_courseId_idx" ON "TeacherCourseQualification"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherCourseQualification_teacherProfileId_courseId_key" ON "TeacherCourseQualification"("teacherProfileId", "courseId");

-- AddForeignKey
ALTER TABLE "TeacherCourseQualification" ADD CONSTRAINT "TeacherCourseQualification_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCourseQualification" ADD CONSTRAINT "TeacherCourseQualification_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherCourseQualification" ADD CONSTRAINT "TeacherCourseQualification_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
