-- CreateTable
CREATE TABLE "unit_condo_fees" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "annual_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_condo_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unit_condo_fees_unit_id_year_key" ON "unit_condo_fees"("unit_id", "year");

-- CreateIndex
CREATE INDEX "unit_condo_fees_unit_id_idx" ON "unit_condo_fees"("unit_id");

-- AddForeignKey
ALTER TABLE "unit_condo_fees" ADD CONSTRAINT "unit_condo_fees_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
