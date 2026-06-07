-- Add condo-level parking share coefficient and unit parking count.
ALTER TABLE "Condo"
ADD COLUMN "parkingShareValue" DECIMAL(6, 3) DEFAULT 0;

ALTER TABLE "Unit"
ADD COLUMN "parkingCount" INTEGER NOT NULL DEFAULT 0;
