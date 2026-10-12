-- Step 0: Ensure every institute has at least one active branch before backfilling
INSERT INTO "Branch" ("id", "instituteId", "name", "address", "phones", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  i.id,
  'شعبه مرکزی',
  'تهران',
  ARRAY[]::TEXT[],
  true,
  NOW(),
  NOW()
FROM "Institute" i
WHERE NOT EXISTS (
  SELECT 1 FROM "Branch" b WHERE b."instituteId" = i.id
);

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT IF EXISTS "Class_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT IF EXISTS "Classroom_branchId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingProposal" DROP CONSTRAINT IF EXISTS "SchedulingProposal_branchId_fkey";

-- DropForeignKey
ALTER TABLE "SchedulingRun" DROP CONSTRAINT IF EXISTS "SchedulingRun_branchId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "TeacherAvailability_teacherProfileId_termId_idx";

-- Backfill and alter Classroom
UPDATE "Classroom" c
SET "branchId" = (
  SELECT b.id FROM "Branch" b
  WHERE b."instituteId" = c."instituteId"
  ORDER BY b."createdAt" ASC LIMIT 1
)
WHERE c."branchId" IS NULL;

DELETE FROM "Classroom" WHERE "branchId" IS NULL;

ALTER TABLE "Classroom" ALTER COLUMN "branchId" SET NOT NULL;

-- Backfill and alter Class
UPDATE "Class" c
SET "branchId" = (
  SELECT b.id FROM "Branch" b
  WHERE b."instituteId" = c."instituteId"
  ORDER BY b."createdAt" ASC LIMIT 1
)
WHERE c."branchId" IS NULL;

DELETE FROM "Class" WHERE "branchId" IS NULL;

ALTER TABLE "Class" ALTER COLUMN "branchId" SET NOT NULL;

-- Backfill and alter ClassRequirement
UPDATE "ClassRequirement" cr
SET "branchId" = (
  SELECT b.id FROM "Branch" b
  WHERE b."instituteId" = cr."instituteId"
  ORDER BY b."createdAt" ASC LIMIT 1
)
WHERE cr."branchId" IS NULL;

DELETE FROM "ClassRequirement" WHERE "branchId" IS NULL;

ALTER TABLE "ClassRequirement" ALTER COLUMN "branchId" SET NOT NULL;

-- Backfill and alter SchedulingProposal
UPDATE "SchedulingProposal" sp
SET "branchId" = (
  SELECT b.id FROM "Branch" b
  WHERE b."instituteId" = sp."instituteId"
  ORDER BY b."createdAt" ASC LIMIT 1
)
WHERE sp."branchId" IS NULL;

DELETE FROM "SchedulingProposal" WHERE "branchId" IS NULL;

ALTER TABLE "SchedulingProposal" ALTER COLUMN "branchId" SET NOT NULL;

-- Backfill and alter SchedulingRun
UPDATE "SchedulingRun" sr
SET "branchId" = (
  SELECT b.id FROM "Branch" b
  WHERE b."instituteId" = sr."instituteId"
  ORDER BY b."createdAt" ASC LIMIT 1
)
WHERE sr."branchId" IS NULL;

DELETE FROM "SchedulingRun" WHERE "branchId" IS NULL;

ALTER TABLE "SchedulingRun" ALTER COLUMN "branchId" SET NOT NULL;

-- Backfill and alter TeacherAvailability
ALTER TABLE "TeacherAvailability" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

UPDATE "TeacherAvailability" ta
SET "branchId" = (
  SELECT b.id FROM "Branch" b
  JOIN "User" u ON u."instituteId" = b."instituteId"
  JOIN "TeacherProfile" tp ON tp."userId" = u.id
  WHERE tp.id = ta."teacherProfileId"
  ORDER BY b."createdAt" ASC LIMIT 1
)
WHERE ta."branchId" IS NULL;

DELETE FROM "TeacherAvailability" WHERE "branchId" IS NULL;

ALTER TABLE "TeacherAvailability" ALTER COLUMN "branchId" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClassRequirement_instituteId_termId_branchId_isActive_idx" ON "ClassRequirement"("instituteId", "termId", "branchId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeacherAvailability_branchId_idx" ON "TeacherAvailability"("branchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeacherAvailability_teacherProfileId_termId_branchId_idx" ON "TeacherAvailability"("teacherProfileId", "termId", "branchId");

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulingProposal" ADD CONSTRAINT "SchedulingProposal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
