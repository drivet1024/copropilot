-- CreateEnum
CREATE TYPE "MaintenanceOccurrenceStatus" AS ENUM ('TODO', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED');

-- CreateTable
CREATE TABLE "maintenance_items" (
    "id" TEXT NOT NULL,
    "condoId" TEXT NOT NULL,
    "sourceSheet" TEXT NOT NULL,
    "sourceRow" INTEGER NOT NULL,
    "categoryNumber" TEXT,
    "categoryName" TEXT,
    "elementCode" TEXT NOT NULL,
    "componentCode" TEXT,
    "description" TEXT NOT NULL,
    "frequencyText" TEXT,
    "monthText" TEXT,
    "performedBy" TEXT,
    "paidBy" TEXT,
    "frequencyType" TEXT,
    "frequencyInterval" INTEGER,
    "frequencyUnit" TEXT,
    "maintenanceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_occurrences" (
    "id" TEXT NOT NULL,
    "maintenanceItemId" TEXT NOT NULL,
    "condoId" TEXT NOT NULL,
    "plannedYear" INTEGER NOT NULL,
    "plannedMonth" INTEGER NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "status" "MaintenanceOccurrenceStatus" NOT NULL DEFAULT 'TODO',
    "completedDate" TIMESTAMP(3),
    "completedBy" TEXT,
    "vendorId" TEXT,
    "cost" DECIMAL(10,2),
    "invoiceDocumentId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_items_condoId_sourceSheet_elementCode_componentCode_description_key" ON "maintenance_items"("condoId", "sourceSheet", "elementCode", "componentCode", "description");

-- CreateIndex
CREATE INDEX "maintenance_items_condoId_idx" ON "maintenance_items"("condoId");

-- CreateIndex
CREATE INDEX "maintenance_items_maintenanceType_idx" ON "maintenance_items"("maintenanceType");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_occurrences_maintenanceItemId_plannedYear_plannedMonth_key" ON "maintenance_occurrences"("maintenanceItemId", "plannedYear", "plannedMonth");

-- CreateIndex
CREATE INDEX "maintenance_occurrences_condoId_idx" ON "maintenance_occurrences"("condoId");

-- CreateIndex
CREATE INDEX "maintenance_occurrences_plannedDate_idx" ON "maintenance_occurrences"("plannedDate");

-- CreateIndex
CREATE INDEX "maintenance_occurrences_status_idx" ON "maintenance_occurrences"("status");

-- AddForeignKey
ALTER TABLE "maintenance_items" ADD CONSTRAINT "maintenance_items_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_occurrences" ADD CONSTRAINT "maintenance_occurrences_maintenanceItemId_fkey" FOREIGN KEY ("maintenanceItemId") REFERENCES "maintenance_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_occurrences" ADD CONSTRAINT "maintenance_occurrences_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_occurrences" ADD CONSTRAINT "maintenance_occurrences_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_occurrences" ADD CONSTRAINT "maintenance_occurrences_invoiceDocumentId_fkey" FOREIGN KEY ("invoiceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
