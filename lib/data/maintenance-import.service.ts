import { prisma } from "@/lib/db/prisma";

import { createPlannedDate } from "./maintenance-date.utils";
import { parseMaintenanceImportWorkbook } from "./maintenance-import.parser";
import type {
  MaintenanceImportPayload,
  MaintenanceImportPreviewRow,
  MaintenanceImportRow,
  MaintenanceImportSummary,
} from "./maintenance-import.types";

export type AnalyzeMaintenanceImportResult = {
  importPayload: MaintenanceImportPayload;
  previewRows: MaintenanceImportPreviewRow[];
  summary: MaintenanceImportSummary;
};

function cloneSummary(summary: MaintenanceImportSummary): MaintenanceImportSummary {
  return {
    ...summary,
    errors: [...summary.errors],
    ignoredSheets: [...summary.ignoredSheets],
    warnings: [...summary.warnings],
  };
}

function resetImportCounters(
  summary: MaintenanceImportSummary
): MaintenanceImportSummary {
  return {
    ...cloneSummary(summary),
    createdItems: 0,
    createdOccurrences: 0,
    duplicateItems: 0,
    duplicateOccurrences: 0,
  };
}

function previewValue(value: string | null) {
  return value?.trim() || "Non défini";
}

function buildPreviewRows(
  rows: MaintenanceImportRow[]
): MaintenanceImportPreviewRow[] {
  return rows.slice(0, 50).map((row) => ({
    category: [row.categoryNumber, row.categoryName].filter(Boolean).join(" - ") || "Non défini",
    componentCode: previewValue(row.componentCode),
    description: row.description,
    elementCode: row.elementCode,
    frequency: previewValue(row.frequencyText),
    maintenanceType:
      row.maintenanceType === "court_terme" ? "Court terme" : "Long terme",
    month: previewValue(row.monthText),
    occurrenceCount: row.occurrences.length,
    paidBy: previewValue(row.paidBy),
    performedBy: previewValue(row.performedBy),
  }));
}

function itemWhere(condoId: string, row: MaintenanceImportRow) {
  return {
    componentCode: row.componentCode,
    condoId,
    description: row.description,
    elementCode: row.elementCode,
    sourceSheet: row.sourceSheet,
  };
}

async function applyExistingCounts(
  condoId: string,
  payload: MaintenanceImportPayload
) {
  const summary = cloneSummary(payload.summary);

  for (const row of payload.rows) {
    const existingItem = await prisma.maintenanceItem.findFirst({
      where: itemWhere(condoId, row),
      select: {
        id: true,
      },
    });

    if (existingItem) {
      summary.duplicateItems += 1;
      if (row.occurrences.length > 0) {
        summary.duplicateOccurrences += await prisma.maintenanceOccurrence.count({
          where: {
            maintenanceItemId: existingItem.id,
            OR: row.occurrences.map((occurrence) => ({
              plannedMonth: occurrence.plannedMonth,
              plannedYear: occurrence.plannedYear,
            })),
          },
        });
      }
    }
  }

  return {
    ...payload,
    summary,
  };
}

export async function analyzeMaintenanceImportWorkbook({
  buffer,
  condoId,
}: {
  buffer: Buffer;
  condoId: string;
}): Promise<AnalyzeMaintenanceImportResult> {
  const parsed = await parseMaintenanceImportWorkbook(buffer);
  const importPayload = await applyExistingCounts(condoId, parsed);

  return {
    importPayload,
    previewRows: buildPreviewRows(importPayload.rows),
    summary: importPayload.summary,
  };
}

function assertPayload(payload: MaintenanceImportPayload) {
  if (!payload || !Array.isArray(payload.rows) || !payload.summary) {
    throw new Error("Les données analysées sont invalides. Relancez l’analyse du fichier.");
  }
}

function occurrenceDate(occurrence: { plannedMonth: number; plannedYear: number }) {
  return createPlannedDate(occurrence.plannedYear, occurrence.plannedMonth);
}

export async function confirmMaintenanceImportPayload({
  condoId,
  payload,
}: {
  condoId: string;
  payload: MaintenanceImportPayload;
}): Promise<AnalyzeMaintenanceImportResult> {
  assertPayload(payload);

  const summary = resetImportCounters(payload.summary);

  if (summary.errors.length > 0) {
    throw new Error("Corrigez les erreurs avant de confirmer l’import.");
  }

  for (const row of payload.rows) {
    const existingItem = await prisma.maintenanceItem.findFirst({
      where: itemWhere(condoId, row),
      select: {
        id: true,
      },
    });

    const item =
      existingItem ??
      (await prisma.maintenanceItem.create({
        data: {
          categoryName: row.categoryName,
          categoryNumber: row.categoryNumber,
          componentCode: row.componentCode,
          condoId,
          description: row.description,
          elementCode: row.elementCode,
          frequencyInterval: row.frequencyInterval,
          frequencyText: row.frequencyText,
          frequencyType: row.frequencyType,
          frequencyUnit: row.frequencyUnit,
          maintenanceType: row.maintenanceType,
          monthText: row.monthText,
          paidBy: row.paidBy,
          performedBy: row.performedBy,
          sourceRow: row.sourceRow,
          sourceSheet: row.sourceSheet,
        },
        select: {
          id: true,
        },
      }));

    if (existingItem) {
      summary.duplicateItems += 1;
    } else {
      summary.createdItems += 1;
    }

    for (const occurrence of row.occurrences) {
      const existingOccurrence = await prisma.maintenanceOccurrence.findFirst({
        where: {
          maintenanceItemId: item.id,
          plannedMonth: occurrence.plannedMonth,
          plannedYear: occurrence.plannedYear,
        },
        select: {
          id: true,
        },
      });

      if (existingOccurrence) {
        summary.duplicateOccurrences += 1;
        continue;
      }

      await prisma.maintenanceOccurrence.create({
        data: {
          condoId,
          maintenanceItemId: item.id,
          plannedDate: occurrenceDate(occurrence),
          plannedMonth: occurrence.plannedMonth,
          plannedYear: occurrence.plannedYear,
          status: "TODO",
        },
      });

      summary.createdOccurrences += 1;
    }
  }

  console.log("[maintenance-import] Import confirmé", summary);

  return {
    importPayload: {
      rows: payload.rows,
      summary,
    },
    previewRows: buildPreviewRows(payload.rows),
    summary,
  };
}
