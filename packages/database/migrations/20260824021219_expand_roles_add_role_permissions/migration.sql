-- Step 1: Rename existing INSTITUTE_ADMIN to ADMIN
ALTER TYPE "Role" RENAME VALUE 'INSTITUTE_ADMIN' TO 'ADMIN';

-- Step 2: Add new role values
ALTER TYPE "Role" ADD VALUE 'ASSISTANT';
ALTER TYPE "Role" ADD VALUE 'SUPERVISOR';
ALTER TYPE "Role" ADD VALUE 'SUPER_CLERK';
ALTER TYPE "Role" ADD VALUE 'TEACHER';
ALTER TYPE "Role" ADD VALUE 'SUPER_STUDENT';

-- Step 3: CreateTable RolePermission
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RolePermission_instituteId_idx" ON "RolePermission"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_instituteId_role_key" ON "RolePermission"("instituteId", "role");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
