-- CreateIndex
CREATE INDEX "Class_termId_idx" ON "Class"("termId");

-- CreateIndex
CREATE INDEX "Class_courseId_idx" ON "Class"("courseId");

-- CreateIndex
CREATE INDEX "Course_prerequisiteId_idx" ON "Course"("prerequisiteId");

-- CreateIndex
CREATE INDEX "Transaction_studentId_idx" ON "Transaction"("studentId");
