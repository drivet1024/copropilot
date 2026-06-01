-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MASTER_USER', 'CONDO_MANAGER', 'BOARD_MEMBER', 'OWNER', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "condoId" TEXT,
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "unitId" TEXT,
ADD COLUMN "role_new" "UserRole" NOT NULL DEFAULT 'VIEWER';

UPDATE "User"
SET "role_new" = CASE
  WHEN "role" = 'MASTER_USER' THEN 'MASTER_USER'::"UserRole"
  WHEN "role" = 'CONDO_MANAGER' THEN 'CONDO_MANAGER'::"UserRole"
  WHEN "role" = 'BOARD_MEMBER' THEN 'BOARD_MEMBER'::"UserRole"
  WHEN "role" = 'OWNER' THEN 'OWNER'::"UserRole"
  WHEN "role" = 'ADMIN' THEN 'MASTER_USER'::"UserRole"
  ELSE 'VIEWER'::"UserRole"
END;

ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
