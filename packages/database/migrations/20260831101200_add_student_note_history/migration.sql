-- Convert student profile notes from single text field to history records.
ALTER TABLE "StudentProfile"
  DROP COLUMN IF EXISTS "notes";

CREATE TABLE "StudentNote" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentNote_studentProfileId_idx" ON "StudentNote"("studentProfileId");
CREATE INDEX "StudentNote_createdByUserId_idx" ON "StudentNote"("createdByUserId");

ALTER TABLE "StudentNote"
  ADD CONSTRAINT "StudentNote_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId")
  REFERENCES "StudentProfile"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "StudentNote"
  ADD CONSTRAINT "StudentNote_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId")
  REFERENCES "User"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
