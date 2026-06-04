CREATE TYPE "PaymentMethod" AS ENUM ('CHEQUE', 'BANK_TRANSFER', 'PRE_AUTHORIZED', 'CASH', 'OTHER');

ALTER TABLE "Unit" ADD COLUMN "monthlyCondoFee" DECIMAL(10, 2);

CREATE TABLE "CondoFeePayment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "condoCorporationId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "chequeNumber" TEXT,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CondoFeePayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CondoFeePayment_tenantId_idx" ON "CondoFeePayment"("tenantId");
CREATE INDEX "CondoFeePayment_condoCorporationId_idx" ON "CondoFeePayment"("condoCorporationId");
CREATE INDEX "CondoFeePayment_unitId_idx" ON "CondoFeePayment"("unitId");
CREATE INDEX "CondoFeePayment_paymentDate_idx" ON "CondoFeePayment"("paymentDate");
CREATE INDEX "CondoFeePayment_paymentMethod_idx" ON "CondoFeePayment"("paymentMethod");

ALTER TABLE "CondoFeePayment"
  ADD CONSTRAINT "CondoFeePayment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CondoFeePayment"
  ADD CONSTRAINT "CondoFeePayment_condoCorporationId_fkey"
  FOREIGN KEY ("condoCorporationId") REFERENCES "Condo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CondoFeePayment"
  ADD CONSTRAINT "CondoFeePayment_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CondoFeePayment"
  ADD CONSTRAINT "CondoFeePayment_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
