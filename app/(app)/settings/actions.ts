"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";
import type { CurrentCondo } from "@/lib/data/condos";
import { assertMaintenanceOccurrenceAccess } from "@/lib/auth/tenant-access";
import {
  analyzeUnitImportWorkbook,
  confirmUnitImportPayload,
  type ExistingUnitImportBehavior,
  type UnitImportPayload,
  type UnitImportPreviewRow,
  type UnitImportSummary,
} from "@/lib/data/unit-import";
import {
  analyzeMaintenanceImportWorkbook,
  confirmMaintenanceImportPayload,
} from "@/lib/data/maintenance-import.service";
import type {
  MaintenanceImportPayload,
  MaintenanceImportPreviewRow,
  MaintenanceImportSummary,
} from "@/lib/data/maintenance-import.types";

export type ResetDatabaseResult = {
  ok: boolean;
  message: string;
};

export type ImportUnitsResult = {
  importPayload?: UnitImportPayload;
  ok: boolean;
  message: string;
  previewRows?: UnitImportPreviewRow[];
  summary?: UnitImportSummary;
};

export type ImportMaintenanceResult = {
  importPayload?: MaintenanceImportPayload;
  ok: boolean;
  message: string;
  previewRows?: MaintenanceImportPreviewRow[];
  summary?: MaintenanceImportSummary;
};

export type MaintenanceOccurrenceActionResult = {
  ok: boolean;
  message: string;
};

type ExcelImportContext =
  | { error: ImportUnitsResult }
  | {
      behavior: ExistingUnitImportBehavior;
      buffer: Buffer;
      condo: CurrentCondo;
      fileName: string;
      user: SessionUser;
    };

type ImportCondoContext =
  | { error: ImportUnitsResult }
  | {
      condo: CurrentCondo;
      user: SessionUser;
    };

type MaintenanceExcelImportContext =
  | { error: ImportMaintenanceResult }
  | {
      buffer: Buffer;
      condo: CurrentCondo;
      fileName: string;
      user: SessionUser;
    };

const MANAGE_UNIT_IMPORT_ROLES: SessionUser["role"][] = [
  "MASTER_USER",
  "CONDO_MANAGER",
];

function canManageUnitImports(role: SessionUser["role"]) {
  return MANAGE_UNIT_IMPORT_ROLES.includes(role);
}

function getImportBehavior(formData: FormData): ExistingUnitImportBehavior {
  return formData.get("existingUnitBehavior") === "ignore"
    ? "ignore"
    : "update";
}

async function getImportCondoContext(): Promise<ImportCondoContext> {
  const user = await requireUser();

  if (!canManageUnitImports(user.role)) {
    return {
      error: {
        ok: false,
        message: "Vous n’avez pas les droits requis pour importer des unités.",
      } satisfies ImportUnitsResult,
    };
  }

  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return {
      error: {
        ok: false,
        message:
          "Aucune copropriété configurée. Créez une copropriété avant d’importer des unités.",
      } satisfies ImportUnitsResult,
    };
  }

  return { condo, user };
}

async function getMaintenanceExcelImportContext(
  formData: FormData
): Promise<MaintenanceExcelImportContext> {
  const context = await getImportCondoContext();

  if ("error" in context) {
    return {
      error: {
        ok: false,
        message: context.error.message.replace("des unités", "du carnet d’entretien"),
      },
    };
  }

  const file = formData.get("file");
  const hasFile = file instanceof File;

  console.log("[analyzeMaintenanceImportExcel] Fichier reçu", {
    fileName: hasFile ? file.name : null,
    hasFile,
    size: hasFile ? file.size : 0,
    type: hasFile ? file.type : null,
  });

  if (!hasFile || file.size === 0) {
    return {
      error: {
        ok: false,
        message: "Veuillez sélectionner un fichier Excel.",
      },
    };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      error: {
        ok: false,
        message: "Le fichier doit être au format .xlsx.",
      },
    };
  }

  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    condo: context.condo,
    fileName: file.name,
    user: context.user,
  };
}

async function getExcelImportContext(
  formData: FormData
): Promise<ExcelImportContext> {
  const context = await getImportCondoContext();

  if ("error" in context) {
    return context;
  }

  const file = formData.get("file");
  const hasFile = file instanceof File;

  console.log("[analyzeUnitsImportExcel] Fichier reçu", {
    fileName: hasFile ? file.name : null,
    hasFile,
    size: hasFile ? file.size : 0,
    type: hasFile ? file.type : null,
  });

  if (!hasFile || file.size === 0) {
    return {
      error: {
        ok: false,
        message: "Veuillez sélectionner un fichier Excel.",
      } satisfies ImportUnitsResult,
    };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      error: {
        ok: false,
        message: "Le fichier doit être au format .xlsx.",
      } satisfies ImportUnitsResult,
    };
  }

  return {
    behavior: getImportBehavior(formData),
    buffer: Buffer.from(await file.arrayBuffer()),
    condo: context.condo,
    fileName: file.name,
    user: context.user,
  };
}

function importErrorMessage(
  error: unknown,
  phase: "analysis" | "import"
) {
  if (!(error instanceof Error)) {
    return phase === "analysis"
      ? "Une erreur est survenue pendant l’analyse du fichier."
      : "Une erreur est survenue pendant l’importation.";
  }

  if (
    [
      "Aucune unité valide trouvée dans le fichier.",
      "La colonne unite est obligatoire.",
      "Les données analysées sont invalides. Relancez l’analyse du fichier.",
      "L’onglet Import CoproPilot est introuvable.",
    ].includes(error.message)
  ) {
    return error.message;
  }

  return phase === "analysis"
    ? "Une erreur est survenue pendant l’analyse du fichier."
    : "Une erreur est survenue pendant l’importation.";
}

export async function resetDatabaseData(): Promise<ResetDatabaseResult> {
  const user = await requireUser();

  if (!canManageUnitImports(user.role)) {
    return {
      ok: false,
      message: "Vous n’avez pas les droits requis pour réinitialiser les données.",
    };
  }

  try {
    await prisma.$transaction([
      // 1. Données de paiement
      prisma.condoFeePayment.deleteMany(),
      prisma.condoFeePaymentHistory.deleteMany(),

      // 2. Logs d'assurance
      prisma.insuranceReminderLog.deleteMany(),

      // 3. Membres et conseils
      prisma.condoBoardMembership.deleteMany(),
      prisma.condoBoard.deleteMany(),

      // 4. Carnet d'entretien
      prisma.maintenanceOccurrence.deleteMany(),
      prisma.maintenanceItem.deleteMany(),

      // 5. Unités
      prisma.unit.deleteMany(),

      // 6. Immeubles
      prisma.building.deleteMany(),

      // 7. Entités liées à la copropriété
      prisma.document.deleteMany(),
      prisma.maintenanceTask.deleteMany(),
      prisma.vendor.deleteMany(),

      // 8. Copropriétés
      prisma.condo.deleteMany(),

      // 9. Organisation
      prisma.organization.deleteMany(),
    ]);

    console.log(
      `[resetDatabaseData] Base réinitialisée par l'utilisateur ${user.email} (${user.role})`
    );

    return {
      ok: true,
      message: "Toutes les données de test ont été supprimées avec succès.",
    };
  } catch (error) {
    console.error("[resetDatabaseData] Échec de la réinitialisation", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la réinitialisation.",
    };
  }
}

export async function analyzeUnitsImportExcel(
  formData: FormData
): Promise<ImportUnitsResult> {
  const context = await getExcelImportContext(formData);

  if ("error" in context) {
    return context.error;
  }

  try {
    console.log("[analyzeUnitsImportExcel] Analyse demandée", {
      behavior: context.behavior,
      condoId: context.condo.id,
      fileName: context.fileName,
    });

    const analysis = await analyzeUnitImportWorkbook({
      behavior: context.behavior,
      buffer: context.buffer,
      condoId: context.condo.id,
    });

    if (analysis.summary.validUnits === 0) {
      return {
        ok: false,
        message: "Aucune unité valide trouvée dans le fichier.",
        summary: analysis.summary,
      };
    }

    return {
      ok: true,
      importPayload: analysis.importPayload,
      message: "Analyse terminée. Le fichier est prêt à être importé.",
      previewRows: analysis.previewRows,
      summary: analysis.summary,
    };
  } catch (error) {
    console.error("[analyzeUnitsImportExcel] Échec de l’analyse", error);

    return {
      ok: false,
      message: importErrorMessage(error, "analysis"),
    };
  }
}

export async function confirmUnitsImport(
  payload: UnitImportPayload
): Promise<ImportUnitsResult> {
  const context = await getImportCondoContext();

  if ("error" in context) {
    return context.error;
  }

  try {
    console.log("[confirmUnitsImport] Importation confirmée", {
      behavior: payload?.behavior,
      condoId: context.condo.id,
      rowCount: payload?.rows?.length ?? 0,
    });

    const result = await confirmUnitImportPayload({
      condoId: context.condo.id,
      payload,
    });

    revalidatePath("/condos/units");
    revalidatePath("/condos");

    console.log(
      `[confirmUnitsImport] Unités importées par ${context.user.email} (${context.user.role})`,
      result.summary
    );

    return {
      ok: true,
      message: "L’importation des unités est terminée.",
      previewRows: result.previewRows,
      summary: result.summary,
    };
  } catch (error) {
    console.error("[confirmUnitsImport] Échec de l’importation", error);

    return {
      ok: false,
      message: importErrorMessage(error, "import"),
    };
  }
}

export async function analyzeMaintenanceImportExcel(
  formData: FormData
): Promise<ImportMaintenanceResult> {
  const context = await getMaintenanceExcelImportContext(formData);

  if ("error" in context) {
    return context.error;
  }

  try {
    console.log("[analyzeMaintenanceImportExcel] Analyse demandée", {
      condoId: context.condo.id,
      fileName: context.fileName,
    });

    const analysis = await analyzeMaintenanceImportWorkbook({
      buffer: context.buffer,
      condoId: context.condo.id,
    });

    if (analysis.summary.shortTermTasks + analysis.summary.longTermTasks === 0) {
      return {
        ok: false,
        message: "Aucune tâche d’entretien valide trouvée dans le fichier.",
        summary: analysis.summary,
      };
    }

    return {
      ok: analysis.summary.errors.length === 0,
      importPayload: analysis.importPayload,
      message:
        analysis.summary.errors.length === 0
          ? "Analyse terminée. Le carnet d’entretien est prêt à être importé."
          : "Analyse terminée avec des erreurs à corriger avant import.",
      previewRows: analysis.previewRows,
      summary: analysis.summary,
    };
  } catch (error) {
    console.error("[analyzeMaintenanceImportExcel] Échec de l’analyse", error);

    return {
      ok: false,
      message: "Une erreur est survenue pendant l’analyse du fichier.",
    };
  }
}

export async function confirmMaintenanceImport(
  payload: MaintenanceImportPayload
): Promise<ImportMaintenanceResult> {
  const context = await getImportCondoContext();

  if ("error" in context) {
    return {
      ok: false,
      message: context.error.message.replace("des unités", "du carnet d’entretien"),
    };
  }

  try {
    const result = await confirmMaintenanceImportPayload({
      condoId: context.condo.id,
      payload,
    });

    revalidatePath("/maintenance");
    revalidatePath("/settings");

    console.log(
      `[confirmMaintenanceImport] Carnet importé par ${context.user.email} (${context.user.role})`,
      result.summary
    );

    return {
      ok: true,
      message: "L’importation du carnet d’entretien est terminée.",
      previewRows: result.previewRows,
      summary: result.summary,
    };
  } catch (error) {
    console.error("[confirmMaintenanceImport] Échec de l’importation", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l’importation.",
    };
  }
}

function optionalActionText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function optionalCost(value: FormDataEntryValue | null) {
  const text = optionalActionText(value);

  if (!text) {
    return null;
  }

  const normalized = text.replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Le coût est invalide.");
  }

  return normalized;
}

function actionOccurrenceId(formData: FormData) {
  const occurrenceId = optionalActionText(formData.get("occurrenceId"));

  if (!occurrenceId) {
    throw new Error("Occurrence d’entretien introuvable.");
  }

  return occurrenceId;
}

async function ensureCanManageMaintenanceOccurrence(formData: FormData) {
  const user = await requireUser();

  if (!canManageUnitImports(user.role)) {
    throw new Error("Vous n’avez pas les droits requis pour modifier une occurrence.");
  }

  const occurrenceId = actionOccurrenceId(formData);
  await assertMaintenanceOccurrenceAccess(user, occurrenceId);

  return {
    occurrenceId,
    user,
  };
}

export async function completeMaintenanceOccurrenceAction(
  formData: FormData
): Promise<MaintenanceOccurrenceActionResult> {
  try {
    const { occurrenceId, user } = await ensureCanManageMaintenanceOccurrence(formData);

    await prisma.maintenanceOccurrence.update({
      where: { id: occurrenceId },
      data: {
        completedBy: user.name ?? user.email,
        completedDate: new Date(),
        cost: optionalCost(formData.get("cost")),
        note: optionalActionText(formData.get("note")),
        status: "COMPLETED",
      },
    });

    revalidatePath("/maintenance");

    return {
      ok: true,
      message: "Occurrence marquée comme complétée.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de compléter l’occurrence.",
    };
  }
}

export async function postponeMaintenanceOccurrenceAction(
  formData: FormData
): Promise<MaintenanceOccurrenceActionResult> {
  try {
    const { occurrenceId } = await ensureCanManageMaintenanceOccurrence(formData);
    const plannedDateText = optionalActionText(formData.get("plannedDate"));

    if (!plannedDateText) {
      throw new Error("La nouvelle date est obligatoire.");
    }

    const plannedDate = new Date(`${plannedDateText}T00:00:00.000Z`);

    if (Number.isNaN(plannedDate.getTime())) {
      throw new Error("La nouvelle date est invalide.");
    }

    await prisma.maintenanceOccurrence.update({
      where: { id: occurrenceId },
      data: {
        note: optionalActionText(formData.get("note")),
        plannedDate,
        plannedMonth: plannedDate.getUTCMonth() + 1,
        plannedYear: plannedDate.getUTCFullYear(),
        status: "POSTPONED",
      },
    });

    revalidatePath("/maintenance");

    return {
      ok: true,
      message: "Occurrence reportée.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de reporter l’occurrence.",
    };
  }
}

export async function cancelMaintenanceOccurrenceAction(
  formData: FormData
): Promise<MaintenanceOccurrenceActionResult> {
  try {
    const { occurrenceId } = await ensureCanManageMaintenanceOccurrence(formData);

    await prisma.maintenanceOccurrence.update({
      where: { id: occurrenceId },
      data: {
        note: optionalActionText(formData.get("note")),
        status: "CANCELLED",
      },
    });

    revalidatePath("/maintenance");

    return {
      ok: true,
      message: "Occurrence annulée.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d’annuler l’occurrence.",
    };
  }
}
