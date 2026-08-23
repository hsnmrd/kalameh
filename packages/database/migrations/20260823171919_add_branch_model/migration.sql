-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branchId" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_instituteId_idx" ON "Branch"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_instituteId_key" ON "Branch"("name", "instituteId");

-- CreateIndex
CREATE INDEX "Class_branchId_idx" ON "Class"("branchId");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
