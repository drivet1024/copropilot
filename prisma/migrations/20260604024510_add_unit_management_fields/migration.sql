-- CreateEnum
CREATE TYPE "UnitOccupancyStatus" AS ENUM ('OWNER_OCCUPIED', 'NON_OWNER_OCCUPIED', 'RENTED', 'VACANT');

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "parkingSpace" TEXT,
ADD COLUMN     "sharePercentage" DECIMAL(6,3),
ADD COLUMN     "status" "UnitOccupancyStatus",
ADD COLUMN     "storageLocker" TEXT;

-- CreateIndex
CREATE INDEX "Unit_buildingId_idx" ON "Unit"("buildingId");

-- CreateIndex
CREATE INDEX "Unit_number_idx" ON "Unit"("number");
