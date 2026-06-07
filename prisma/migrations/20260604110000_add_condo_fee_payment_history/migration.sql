-- CreateTable
CREATE TABLE "CondoFeePaymentHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "condoCorporationId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CondoFeePaymentHistory_pkey" PRIMARY KEY ("id")
);

-- Preserve existing manual payments as monthly history rows.
INSERT INTO "CondoFeePaymentHistory" (
    "id",
    "tenantId",
    "condoCorporationId",
    "unitId",
    "periodStart",
    "amount",
    "isPaid",
    "paidAt",
    "recordedById",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT ON ("unitId", date_trunc('month', "paymentDate"))
    'hist_' || "id",
    "tenantId",
    "condoCorporationId",
    "unitId",
    date_trunc('month', "paymentDate"),
    "amount",
    true,
    "paymentDate",
    "createdById",
    "createdAt",
    "updatedAt"
FROM "CondoFeePayment"
ORDER BY "unitId", date_trunc('month', "paymentDate"), "updatedAt" DESC;

-- CreateIndex
CREATE UNIQUE INDEX "CondoFeePaymentHistory_unitId_periodStart_key" ON "CondoFeePaymentHistory"("unitId", "periodStart");

-- CreateIndex
CREATE INDEX "CondoFeePaymentHistory_tenantId_idx" ON "CondoFeePaymentHistory"("tenantId");

-- CreateIndex
CREATE INDEX "CondoFeePaymentHistory_condoCorporationId_idx" ON "CondoFeePaymentHistory"("condoCorporationId");

-- CreateIndex
CREATE INDEX "CondoFeePaymentHistory_periodStart_idx" ON "CondoFeePaymentHistory"("periodStart");

-- CreateIndex
CREATE INDEX "CondoFeePaymentHistory_isPaid_idx" ON "CondoFeePaymentHistory"("isPaid");

-- AddForeignKey
ALTER TABLE "CondoFeePaymentHistory" ADD CONSTRAINT "CondoFeePaymentHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondoFeePaymentHistory" ADD CONSTRAINT "CondoFeePaymentHistory_condoCorporationId_fkey" FOREIGN KEY ("condoCorporationId") REFERENCES "Condo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondoFeePaymentHistory" ADD CONSTRAINT "CondoFeePaymentHistory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondoFeePaymentHistory" ADD CONSTRAINT "CondoFeePaymentHistory_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
