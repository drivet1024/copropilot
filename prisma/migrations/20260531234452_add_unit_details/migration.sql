-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "bathroomCount" DOUBLE PRECISION,
ADD COLUMN     "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFireplace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceRenewalDate" TIMESTAMP(3),
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "ownerName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "roomCount" TEXT,
ADD COLUMN     "squareFeet" INTEGER,
ADD COLUMN     "waterHeaterDate" TIMESTAMP(3);
