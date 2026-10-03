CREATE TABLE "StudentNote" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

-- Migrate existing notes from StudentProfile if any exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'StudentProfile' AND column_name = 'notes'
  ) THEN
    INSERT INTO "StudentNote" ("id", "studentProfileId", "createdByUserId", "content", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid()::text,
      sp."id",
      sp."userId",
      sp."notes",
      sp."createdAt",
      sp."updatedAt"
    FROM "StudentProfile" sp
    WHERE sp."notes" IS NOT NULL AND BTRIM(sp."notes") <> '';
  END IF;
END $$;

-- Convert student profile notes from single text field to history records.
ALTER TABLE "StudentProfile"
  DROP COLUMN IF EXISTS "notes";

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
