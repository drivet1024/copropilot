-- AddColumn
ALTER TABLE "CondoFeePayment" ADD COLUMN "paymentMonth" TEXT NOT NULL DEFAULT '';

-- Update existing rows with paymentMonth based on paymentDate
UPDATE "CondoFeePayment" 
SET "paymentMonth" = to_char("paymentDate", 'YYYY-MM')
WHERE "paymentMonth" = '';

-- Add not null constraint after data is populated
ALTER TABLE "CondoFeePayment" ALTER COLUMN "paymentMonth" SET NOT NULL,
ALTER COLUMN "paymentMonth" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "CondoFeePayment_paymentMonth_idx" ON "CondoFeePayment"("paymentMonth");
