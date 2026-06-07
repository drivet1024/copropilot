-- CreateTable: CondoBoard
CREATE TABLE "CondoBoard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "condoCorporationId" TEXT NOT NULL,
    "name" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CondoBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CondoBoard
CREATE INDEX "CondoBoard_tenantId_idx" ON "CondoBoard"("tenantId");
CREATE INDEX "CondoBoard_condoCorporationId_idx" ON "CondoBoard"("condoCorporationId");
CREATE INDEX "CondoBoard_status_idx" ON "CondoBoard"("status");
CREATE INDEX "CondoBoard_startDate_idx" ON "CondoBoard"("startDate");

-- ForeignKey: CondoBoard -> Organization
ALTER TABLE "CondoBoard" ADD CONSTRAINT "CondoBoard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ForeignKey: CondoBoard -> Condo
ALTER TABLE "CondoBoard" ADD CONSTRAINT "CondoBoard_condoCorporationId_fkey" FOREIGN KEY ("condoCorporationId") REFERENCES "Condo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add boardId to CondoBoardMembership
ALTER TABLE "CondoBoardMembership" ADD COLUMN "boardId" TEXT;
ALTER TABLE "CondoBoardMembership" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "CondoBoardMembership" ALTER COLUMN "startDate" DROP NOT NULL;

-- Migrer les membres existants : créer un board par défaut pour chaque copropriété
INSERT INTO "CondoBoard" ("id", "tenantId", "condoCorporationId", "name", "startDate", "status", "createdAt", "updatedAt")
SELECT DISTINCT
    'board_default_' || "condoCorporationId",
    "tenantId",
    "condoCorporationId",
    'Conseil actuel',
    (SELECT MIN("startDate") FROM "CondoBoardMembership" WHERE "condoCorporationId" = cb."condoCorporationId") AS "startDate",
    'ACTIVE',
    NOW(),
    NOW()
FROM "CondoBoardMembership" cb;

-- Lier tous les membres existants à leur board par défaut
UPDATE "CondoBoardMembership" SET "boardId" = 'board_default_' || "condoCorporationId";

-- Rendre boardId NOT NULL une fois les données migrées
ALTER TABLE "CondoBoardMembership" ALTER COLUMN "boardId" SET NOT NULL;

-- Ajouter la clé étrangère et les index
ALTER TABLE "CondoBoardMembership" ADD CONSTRAINT "CondoBoardMembership_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "CondoBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "CondoBoardMembership_boardId_idx" ON "CondoBoardMembership"("boardId");
CREATE INDEX "CondoBoardMembership_status_idx" ON "CondoBoardMembership"("status");

-- Supprimer les anciens index qui ne sont plus nécessaires
DROP INDEX IF EXISTS "CondoBoardMembership_condoCorporationId_idx";
DROP INDEX IF EXISTS "CondoBoardMembership_endDate_idx";
DROP INDEX IF EXISTS "CondoBoardMembership_startDate_idx";

-- Supprimer les anciennes colonnes déplacées dans CondoBoard
ALTER TABLE "CondoBoardMembership" DROP COLUMN "condoCorporationId";
