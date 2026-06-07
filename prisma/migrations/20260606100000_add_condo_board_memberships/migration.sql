CREATE TYPE "CondoBoardRole" AS ENUM (
  'PRESIDENT',
  'VICE_PRESIDENT',
  'TREASURER',
  'SECRETARY',
  'DIRECTOR'
);

CREATE TABLE "CondoBoardMembership" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "condoCorporationId" TEXT NOT NULL,
  "unitId" TEXT,
  "personName" TEXT NOT NULL,
  "role" "CondoBoardRole" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "CondoBoardMembership_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CondoBoardMembership_tenantId_idx" ON "CondoBoardMembership"("tenantId");
CREATE INDEX "CondoBoardMembership_condoCorporationId_idx" ON "CondoBoardMembership"("condoCorporationId");
CREATE INDEX "CondoBoardMembership_unitId_idx" ON "CondoBoardMembership"("unitId");
CREATE INDEX "CondoBoardMembership_role_idx" ON "CondoBoardMembership"("role");
CREATE INDEX "CondoBoardMembership_startDate_idx" ON "CondoBoardMembership"("startDate");
CREATE INDEX "CondoBoardMembership_endDate_idx" ON "CondoBoardMembership"("endDate");

ALTER TABLE "CondoBoardMembership"
  ADD CONSTRAINT "CondoBoardMembership_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CondoBoardMembership"
  ADD CONSTRAINT "CondoBoardMembership_condoCorporationId_fkey"
  FOREIGN KEY ("condoCorporationId") REFERENCES "Condo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CondoBoardMembership"
  ADD CONSTRAINT "CondoBoardMembership_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
