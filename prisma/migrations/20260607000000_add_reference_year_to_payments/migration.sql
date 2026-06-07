-- AlterTable: Add reference_year to CondoFeePayment
ALTER TABLE "CondoFeePayment" ADD COLUMN "reference_year" INTEGER;

-- Remplir reference_year à partir des données existantes dans paymentMonth
UPDATE "CondoFeePayment"
SET "reference_year" = CAST(SUBSTRING("paymentMonth" FROM 1 FOR 4) AS INTEGER)
WHERE "reference_year" IS NULL;

