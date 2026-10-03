/*
  Warnings:

  - You are about to drop the `StudentTimeConstraint` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentTimeConstraint" DROP CONSTRAINT "StudentTimeConstraint_instituteId_fkey";

-- DropForeignKey
ALTER TABLE "StudentTimeConstraint" DROP CONSTRAINT "StudentTimeConstraint_studentProfileId_fkey";

-- DropTable
DROP TABLE "StudentTimeConstraint";

-- DropEnum
DROP TYPE "StudentTimeConstraintKind";

-- DropEnum
DROP TYPE "StudentTimeConstraintSource";
