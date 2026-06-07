import ExcelJS from "exceljs";
import os from "node:os";
import path from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { calculateUnitQuotePartTotal } from "@/lib/units/quote-part";

export type ExistingUnitImportBehavior = "update" | "ignore";

export type UnitImportPreviewRow = {
  action: "Créer" | "Mettre à jour" | "Ignorer";
  email: string;
  isExisting: boolean;
  location: string;
  mobile: string;
  parkingCount: number;
  parkingQuotePart: string;
  ownerName: string;
  phone: string;
  quotePartTotal: string;
  sharePercentage: string;
  unitNumber: string;
};

export type UnitImportSummary = {
  createdUnits: number;
  duplicateUnits: number;
  errors: string[];
  existingUnits: number;
  ignoredExistingUnits: number;
  ignoredRows: number;
  newUnits: number;
  totalRowsDetected: number;
  unitsToUpdate: number;
  updatedUnits: number;
  validUnits: number;
  warnings: string[];
};

export type UnitImportPayloadRow = {
  email: string | null;
  hasAirConditioning: boolean | null;
  insuranceRenewalDate: string | null;
  lineNumber: number;
  mobile: string | null;
  parkingCount: number;
  ownerName: string | null;
  phone: string | null;
  sharePercentage: string | null;
  status: "OWNER_OCCUPIED" | "RENTED" | null;
  unitNumber: string;
  waterHeaterDate: string | null;
};

export type UnitImportPayload = {
  behavior: ExistingUnitImportBehavior;
  rows: UnitImportPayloadRow[];
  summaryBase: Pick<
    UnitImportSummary,
    "duplicateUnits" | "ignoredRows" | "totalRowsDetected" | "warnings"
  >;
};

export type UnitImportAnalysis = {
  importPayload?: UnitImportPayload;
  previewRows: UnitImportPreviewRow[];
  summary: UnitImportSummary;
};

type ParsedUnitImportRow = {
  email: string | null;
  hasAirConditioning: boolean | null;
  insuranceRenewalDate: Date | null;
  lineNumber: number;
  mobile: string | null;
  parkingCount: number;
  ownerName: string | null;
  phone: string | null;
  sharePercentage: string | null;
  status: "OWNER_OCCUPIED" | "RENTED" | null;
  unitNumber: string;
  waterHeaterDate: Date | null;
};

type ParsedWorkbook = {
  detectedColumns: string[];
  rows: ParsedUnitImportRow[];
  summaryBase: Pick<
    UnitImportSummary,
    "duplicateUnits" | "ignoredRows" | "totalRowsDetected" | "warnings"
  >;
};

const IMPORT_SHEET_NAME = "Import CoproPilot";
const MAX_WARNINGS = 30;

const unitImportPayloadRowSchema = z.object({
  email: z.string().nullable(),
  hasAirConditioning: z.boolean().nullable(),
  insuranceRenewalDate: z.string().nullable(),
  lineNumber: z.number().int().positive(),
  mobile: z.string().nullable(),
  parkingCount: z.number().int().nonnegative(),
  ownerName: z.string().nullable(),
  phone: z.string().nullable(),
  sharePercentage: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .nullable(),
  status: z.enum(["OWNER_OCCUPIED", "RENTED"]).nullable(),
  unitNumber: z.string().trim().min(1).max(60),
  waterHeaterDate: z.string().nullable(),
});

const unitImportPayloadSchema = z.object({
  behavior: z.enum(["update", "ignore"]),
  rows: z.array(unitImportPayloadRowSchema).min(1),
  summaryBase: z.object({
    duplicateUnits: z.number().int().nonnegative(),
    ignoredRows: z.number().int().nonnegative(),
    totalRowsDetected: z.number().int().nonnegative(),
    warnings: z.array(z.string()).max(MAX_WARNINGS),
  }),
});

const mappedColumns = new Set([
  "adresse_courriel",
  "chauffe_eau_annee",
  "climatiseur_au_dessus_du_foyer",
  "date_fin_couverture",
  "location",
  "nombre_stationnements",
  "proprietaires",
  "quote_part_stationnement_calculee",
  "quote_part_totale_calculee",
  "quote_part_unite",
  "telephone",
  "telephone_2",
  "unite",
]);

const knownColumns = new Set([
  ...mappedColumns,
  "assureur",
  "courriel_locataire",
  "date_debut_couverture",
  "montant_responsabilite_civile",
  "nom_locataire",
  "notes_assurance",
  "numero_police",
  "periode_couverte",
  "personnes_assurees",
  "source_onglet_assurance",
  "telephone_locataire",
  "toilette_crane_changee",
  "tuyau_secheuse",
  "type_assurance",
]);

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function pushWarning(warnings: string[], message: string) {
  if (warnings.length < MAX_WARNINGS) {
    warnings.push(message);
  }
}

function cellText(cell: ExcelJS.Cell) {
  return String(cell.text || "").trim();
}

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function parseBoolean(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized) {
    return null;
  }

  if (
    ["1", "oui", "yes", "true", "vrai", "x", "loue", "location", "rented"].includes(
      normalized
    )
  ) {
    return true;
  }

  if (["0", "non", "no", "false", "faux"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseNonNegativeDecimalText(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function parseNonNegativeInteger(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  return Number(trimmed);
}

function excelSerialDate(value: number) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const excelEpoch = Date.UTC(1899, 11, 30);

  return new Date(excelEpoch + value * millisecondsPerDay);
}

function parseDateText(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3])
    );
  }

  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);

  if (slashMatch) {
    return new Date(
      Number(slashMatch[3]),
      Number(slashMatch[2]) - 1,
      Number(slashMatch[1])
    );
  }

  const parsed = new Date(trimmed);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateCell(cell: ExcelJS.Cell) {
  const value = cell.value;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return excelSerialDate(value);
  }

  return parseDateText(cellText(cell));
}

function parseYearCell(cell: ExcelJS.Cell) {
  const text = cellText(cell);
  const yearMatch = /^(\d{4})$/.exec(text);

  if (yearMatch) {
    return new Date(Number(yearMatch[1]), 0, 1);
  }

  return parseDateCell(cell);
}

function isValidDate(value: Date | null) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function getHeaderMap(worksheet: ExcelJS.Worksheet) {
  const headerMap = new Map<string, number>();
  const columns: string[] = [];
  const ignoredColumns: string[] = [];

  worksheet.getRow(1).eachCell((cell, colNumber) => {
    const header = normalizeHeader(cellText(cell));

    if (!header) {
      return;
    }

    headerMap.set(header, colNumber);
    columns.push(header);

    if (!mappedColumns.has(header)) {
      ignoredColumns.push(header);
    }
  });

  return { columns, headerMap, ignoredColumns };
}

function rowHasValue(row: ExcelJS.Row) {
  let hasValue = false;

  row.eachCell((cell) => {
    if (cellText(cell)) {
      hasValue = true;
    }
  });

  return hasValue;
}

function getCellText(row: ExcelJS.Row, headerMap: Map<string, number>, header: string) {
  const column = headerMap.get(header);

  return column ? cellText(row.getCell(column)) : "";
}

function getCell(row: ExcelJS.Row, headerMap: Map<string, number>, header: string) {
  const column = headerMap.get(header);

  return column ? row.getCell(column) : null;
}

function parseStatus(value: string) {
  const parsed = parseBoolean(value);

  if (parsed === true) {
    return "RENTED" as const;
  }

  if (parsed === false) {
    return "OWNER_OCCUPIED" as const;
  }

  return null;
}

function parseWorkbookRows(worksheet: ExcelJS.Worksheet): ParsedWorkbook {
  const { columns, headerMap, ignoredColumns } = getHeaderMap(worksheet);
  const warnings: string[] = [];

  if (!headerMap.has("unite")) {
    throw new Error("La colonne unite est obligatoire.");
  }

  if (!headerMap.has("proprietaires")) {
    pushWarning(
      warnings,
      "La colonne proprietaires est absente; les propriétaires ne seront pas importés."
    );
  }

  const unsupportedColumns = ignoredColumns.filter((header) =>
    knownColumns.has(header)
  );
  const unknownColumns = ignoredColumns.filter((header) => !knownColumns.has(header));

  if (unsupportedColumns.length > 0) {
    pushWarning(
      warnings,
      `Colonnes reconnues mais non supportées pour l’instant ignorées: ${unsupportedColumns.join(
        ", "
      )}.`
    );
  }

  if (unknownColumns.length > 0) {
    pushWarning(
      warnings,
      `Colonnes inconnues ignorées: ${unknownColumns.join(", ")}.`
    );
  }

  const candidateRows: ParsedUnitImportRow[] = [];
  let totalRowsDetected = 0;
  let ignoredRows = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    if (!rowHasValue(row)) {
      continue;
    }

    totalRowsDetected += 1;

    const unitNumber = getCellText(row, headerMap, "unite");

    if (!unitNumber) {
      ignoredRows += 1;
      pushWarning(
        warnings,
        `Ligne ${rowNumber} ignorée: le numéro d’unité est vide.`
      );
      continue;
    }

    const waterHeaterCell = getCell(row, headerMap, "chauffe_eau_annee");
    const insuranceEndCell = getCell(row, headerMap, "date_fin_couverture");
    const sharePercentageText = getCellText(row, headerMap, "quote_part_unite");
    const parkingCountText = getCellText(row, headerMap, "nombre_stationnements");
    const parsedSharePercentage = parseNonNegativeDecimalText(sharePercentageText);
    const parsedParkingCount = parseNonNegativeInteger(parkingCountText);
    const waterHeaterDate = waterHeaterCell ? parseYearCell(waterHeaterCell) : null;
    const insuranceRenewalDate = insuranceEndCell
      ? parseDateCell(insuranceEndCell)
      : null;

    if (waterHeaterCell && cellText(waterHeaterCell) && !isValidDate(waterHeaterDate)) {
      pushWarning(
        warnings,
        `Ligne ${rowNumber}: la date/année de chauffe-eau est invalide et a été ignorée.`
      );
    }

    if (
      insuranceEndCell &&
      cellText(insuranceEndCell) &&
      !isValidDate(insuranceRenewalDate)
    ) {
      pushWarning(
        warnings,
        `Ligne ${rowNumber}: la date de fin de couverture est invalide et a été ignorée.`
      );
    }

    if (sharePercentageText && parsedSharePercentage === null) {
      pushWarning(
        warnings,
        `Ligne ${rowNumber}: quote_part_unite est invalide et a été ignorée.`
      );
    }

    if (parkingCountText && parsedParkingCount === null) {
      pushWarning(
        warnings,
        `Ligne ${rowNumber}: nombre_stationnements est invalide et la valeur 0 sera utilisée.`
      );
    }

    candidateRows.push({
      email: optionalText(getCellText(row, headerMap, "adresse_courriel")),
      hasAirConditioning: parseBoolean(
        getCellText(row, headerMap, "climatiseur_au_dessus_du_foyer")
      ),
      insuranceRenewalDate: isValidDate(insuranceRenewalDate)
        ? insuranceRenewalDate
        : null,
      lineNumber: rowNumber,
      mobile: optionalText(getCellText(row, headerMap, "telephone_2")),
      parkingCount: parsedParkingCount ?? 0,
      ownerName: optionalText(getCellText(row, headerMap, "proprietaires")),
      phone: optionalText(getCellText(row, headerMap, "telephone")),
      sharePercentage: parsedSharePercentage,
      status: parseStatus(getCellText(row, headerMap, "location")),
      unitNumber,
      waterHeaterDate: isValidDate(waterHeaterDate) ? waterHeaterDate : null,
    });
  }

  const lastLineByUnit = new Map<string, number>();
  const duplicateUnits = new Set<string>();

  for (const row of candidateRows) {
    if (lastLineByUnit.has(row.unitNumber)) {
      duplicateUnits.add(row.unitNumber);
    }

    lastLineByUnit.set(row.unitNumber, row.lineNumber);
  }

  const rows = candidateRows.filter((row) => {
    if (lastLineByUnit.get(row.unitNumber) === row.lineNumber) {
      return true;
    }

    ignoredRows += 1;
    return false;
  });

  if (duplicateUnits.size > 0) {
    pushWarning(
      warnings,
      `Doublons détectés dans le fichier: ${Array.from(duplicateUnits).join(
        ", "
      )}. Seule la dernière ligne de chaque unité sera importée.`
    );
  }

  return {
    detectedColumns: columns,
    rows,
    summaryBase: {
      duplicateUnits: duplicateUnits.size,
      ignoredRows,
      totalRowsDetected,
      warnings,
    },
  };
}

async function readWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();

  const tempFilePath = path.join(
    os.tmpdir(),
    `unit-import-${Date.now()}-${Math.random().toString(36).slice(2)}.xlsx`
  );

  try {
    console.log("[unit-import] Buffer reçu", {
      byteLength: buffer.byteLength,
      length: buffer.length,
      tempFilePath,
    });

    await writeFile(tempFilePath, buffer);

    await workbook.xlsx.readFile(tempFilePath);

    const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);

    console.log("[unit-import] Onglets détectés", sheetNames);

    const worksheet = workbook.getWorksheet(IMPORT_SHEET_NAME);

    if (!worksheet) {
      throw new Error("L’onglet Import CoproPilot est introuvable.");
    }

    const parsedWorkbook = parseWorkbookRows(worksheet);

    console.log("[unit-import] Colonnes détectées", parsedWorkbook.detectedColumns);
    console.log("[unit-import] Lignes lues", {
      ignoredRows: parsedWorkbook.summaryBase.ignoredRows,
      totalRowsDetected: parsedWorkbook.summaryBase.totalRowsDetected,
      validRows: parsedWorkbook.rows.length,
    });

    return parsedWorkbook;
  } finally {
    await unlink(tempFilePath).catch(() => {});
  }
}

async function getExistingUnitMap(condoId: string) {
  const units = await prisma.unit.findMany({
    where: {
      deletedAt: null,
      building: {
        condoId,
      },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      number: true,
    },
  });

  return buildExistingUnitMap(units);
}

async function getCondoParkingShareValue(condoId: string) {
  const condo = await prisma.condo.findUnique({
    where: { id: condoId },
    select: { parkingShareValue: true },
  });

  return Number(condo?.parkingShareValue ?? 0);
}

function buildExistingUnitMap(units: { id: string; number: string }[]) {
  const unitMap = new Map<string, { id: string; number: string }>();
  const duplicateNumbers = new Set<string>();

  for (const unit of units) {
    if (unitMap.has(unit.number)) {
      duplicateNumbers.add(unit.number);
      continue;
    }

    unitMap.set(unit.number, unit);
  }

  return { duplicateNumbers, unitMap };
}

function buildSummary({
  behavior,
  existingUnitNumbers,
  parsedWorkbook,
}: {
  behavior: ExistingUnitImportBehavior;
  existingUnitNumbers: Set<string>;
  parsedWorkbook: ParsedWorkbook;
}): UnitImportSummary {
  const existingUnits = parsedWorkbook.rows.filter((row) =>
    existingUnitNumbers.has(row.unitNumber)
  ).length;
  const newUnits = parsedWorkbook.rows.length - existingUnits;

  return {
    ...parsedWorkbook.summaryBase,
    createdUnits: 0,
    errors: [],
    existingUnits,
    ignoredExistingUnits: behavior === "ignore" ? existingUnits : 0,
    newUnits,
    unitsToUpdate: behavior === "update" ? existingUnits : 0,
    updatedUnits: 0,
    validUnits: parsedWorkbook.rows.length,
  };
}

function previewAction(isExisting: boolean, behavior: ExistingUnitImportBehavior) {
  if (!isExisting) {
    return "Créer" as const;
  }

  return behavior === "update" ? ("Mettre à jour" as const) : ("Ignorer" as const);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function buildImportPayload(
  parsedWorkbook: ParsedWorkbook,
  behavior: ExistingUnitImportBehavior
): UnitImportPayload {
  return {
    behavior,
    rows: parsedWorkbook.rows.map((row) => ({
      email: row.email,
      hasAirConditioning: row.hasAirConditioning,
      insuranceRenewalDate: serializeDate(row.insuranceRenewalDate),
      lineNumber: row.lineNumber,
      mobile: row.mobile,
      parkingCount: row.parkingCount,
      ownerName: row.ownerName,
      phone: row.phone,
      sharePercentage: row.sharePercentage,
      status: row.status,
      unitNumber: row.unitNumber,
      waterHeaterDate: serializeDate(row.waterHeaterDate),
    })),
    summaryBase: {
      duplicateUnits: parsedWorkbook.summaryBase.duplicateUnits,
      ignoredRows: parsedWorkbook.summaryBase.ignoredRows,
      totalRowsDetected: parsedWorkbook.summaryBase.totalRowsDetected,
      warnings: [...parsedWorkbook.summaryBase.warnings],
    },
  };
}

function buildPreviewRows({
  behavior,
  existingUnitNumbers,
  parkingShareValue,
  rows,
}: {
  behavior: ExistingUnitImportBehavior;
  existingUnitNumbers: Set<string>;
  parkingShareValue: number;
  rows: ParsedUnitImportRow[];
}): UnitImportPreviewRow[] {
  return rows.slice(0, 10).map((row) => {
    const isExisting = existingUnitNumbers.has(row.unitNumber);
    const quotePart = calculateUnitQuotePartTotal({
      parkingCount: row.parkingCount,
      parkingShareValue,
      sharePercentage: row.sharePercentage,
    });

    return {
      action: previewAction(isExisting, behavior),
      email: row.email ?? "",
      isExisting,
      location:
        row.status === "RENTED"
          ? "Louée"
          : row.status === "OWNER_OCCUPIED"
            ? "Non louée"
            : "",
      mobile: row.mobile ?? "",
      parkingCount: quotePart.parkingCount,
      parkingQuotePart: formatPercent(quotePart.parkingQuotePart),
      ownerName: row.ownerName ?? "",
      phone: row.phone ?? "",
      quotePartTotal: formatPercent(quotePart.totalQuotePart),
      sharePercentage: formatPercent(quotePart.unitQuotePart),
      unitNumber: row.unitNumber,
    };
  });
}

export async function analyzeUnitImportWorkbook({
  behavior,
  buffer,
  condoId,
}: {
  behavior: ExistingUnitImportBehavior;
  buffer: Buffer;
  condoId: string;
}): Promise<UnitImportAnalysis> {
  const parsedWorkbook = await readWorkbook(buffer);
  const { duplicateNumbers, unitMap } = await getExistingUnitMap(condoId);
  const parkingShareValue = await getCondoParkingShareValue(condoId);
  const warnings = [...parsedWorkbook.summaryBase.warnings];

  if (duplicateNumbers.size > 0) {
    pushWarning(
      warnings,
      `Doublons déjà présents en base: ${Array.from(duplicateNumbers).join(
        ", "
      )}. La première unité trouvée sera utilisée.`
    );
  }

  const summary = buildSummary({
    behavior,
    existingUnitNumbers: new Set(unitMap.keys()),
    parsedWorkbook: {
      ...parsedWorkbook,
      summaryBase: {
        ...parsedWorkbook.summaryBase,
        warnings,
      },
    },
  });

  return {
    importPayload: buildImportPayload(
      {
        ...parsedWorkbook,
        summaryBase: {
          ...parsedWorkbook.summaryBase,
          warnings,
        },
      },
      behavior
    ),
    previewRows: buildPreviewRows({
      behavior,
      existingUnitNumbers: new Set(unitMap.keys()),
      parkingShareValue,
      rows: parsedWorkbook.rows,
    }),
    summary,
  };
}

async function resolveImportBuildingId(
  tx: Prisma.TransactionClient,
  condoId: string
) {
  const building = await tx.building.findFirst({
    where: { condoId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (building) {
    return building.id;
  }

  const condo = await tx.condo.findUnique({
    where: { id: condoId },
    select: { address: true },
  });

  const defaultBuilding = await tx.building.create({
    data: {
      address: condo?.address ?? null,
      condoId,
      name: "Immeuble principal",
    },
    select: { id: true },
  });

  return defaultBuilding.id;
}

function buildUpdateData(row: ParsedUnitImportRow) {
  const data: Prisma.UnitUpdateInput = {};

  if (row.email) data.email = row.email;
  if (row.insuranceRenewalDate) data.insuranceRenewalDate = row.insuranceRenewalDate;
  if (row.mobile) data.mobile = row.mobile;
  if (row.ownerName) data.ownerName = row.ownerName;
  if (row.phone) data.phone = row.phone;
  if (row.sharePercentage !== null) data.sharePercentage = row.sharePercentage;
  if (row.status) data.status = row.status;
  if (row.waterHeaterDate) data.waterHeaterDate = row.waterHeaterDate;
  data.parkingCount = row.parkingCount;
  if (row.hasAirConditioning !== null) {
    data.hasAirConditioning = row.hasAirConditioning;
  }

  return data;
}

function buildCreateData(row: ParsedUnitImportRow, buildingId: string) {
  return {
    buildingId,
    email: row.email,
    hasAirConditioning: row.hasAirConditioning ?? false,
    insuranceRenewalDate: row.insuranceRenewalDate,
    mobile: row.mobile,
    number: row.unitNumber,
    ownerName: row.ownerName,
    parkingCount: row.parkingCount,
    phone: row.phone,
    sharePercentage: row.sharePercentage,
    status: row.status,
    waterHeaterDate: row.waterHeaterDate,
  } satisfies Prisma.UnitUncheckedCreateInput;
}

function optionalPayloadText(value: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function parsePayloadDate({
  fieldLabel,
  lineNumber,
  value,
  warnings,
}: {
  fieldLabel: string;
  lineNumber: number;
  value: string | null;
  warnings: string[];
}) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    pushWarning(
      warnings,
      `Ligne ${lineNumber}: ${fieldLabel} est invalide et a été ignorée.`
    );
    return null;
  }

  return date;
}

function parseUnitImportPayload(payload: UnitImportPayload): {
  behavior: ExistingUnitImportBehavior;
  parsedWorkbook: ParsedWorkbook;
} {
  const parsedPayload = unitImportPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    throw new Error("Les données analysées sont invalides. Relancez l’analyse du fichier.");
  }

  const warnings = [...parsedPayload.data.summaryBase.warnings];
  const candidateRows: ParsedUnitImportRow[] = parsedPayload.data.rows.map((row) => ({
    email: optionalPayloadText(row.email),
    hasAirConditioning: row.hasAirConditioning,
    insuranceRenewalDate: parsePayloadDate({
      fieldLabel: "la date de fin de couverture",
      lineNumber: row.lineNumber,
      value: row.insuranceRenewalDate,
      warnings,
    }),
    lineNumber: row.lineNumber,
    mobile: optionalPayloadText(row.mobile),
    parkingCount: row.parkingCount,
    ownerName: optionalPayloadText(row.ownerName),
    phone: optionalPayloadText(row.phone),
    sharePercentage: optionalPayloadText(row.sharePercentage),
    status: row.status,
    unitNumber: row.unitNumber.trim(),
    waterHeaterDate: parsePayloadDate({
      fieldLabel: "la date/année de chauffe-eau",
      lineNumber: row.lineNumber,
      value: row.waterHeaterDate,
      warnings,
    }),
  }));
  const lastLineByUnit = new Map<string, number>();
  const duplicateUnits = new Set<string>();

  for (const row of candidateRows) {
    if (lastLineByUnit.has(row.unitNumber)) {
      duplicateUnits.add(row.unitNumber);
    }

    lastLineByUnit.set(row.unitNumber, row.lineNumber);
  }

  let ignoredRows = parsedPayload.data.summaryBase.ignoredRows;
  const rows = candidateRows.filter((row) => {
    if (lastLineByUnit.get(row.unitNumber) === row.lineNumber) {
      return true;
    }

    ignoredRows += 1;
    return false;
  });

  if (duplicateUnits.size > 0) {
    pushWarning(
      warnings,
      `Doublons détectés dans les données confirmées: ${Array.from(
        duplicateUnits
      ).join(", ")}. Seule la dernière ligne de chaque unité sera importée.`
    );
  }

  return {
    behavior: parsedPayload.data.behavior,
    parsedWorkbook: {
      detectedColumns: [],
      rows,
      summaryBase: {
        duplicateUnits: Math.max(
          parsedPayload.data.summaryBase.duplicateUnits,
          duplicateUnits.size
        ),
        ignoredRows,
        totalRowsDetected: Math.max(
          parsedPayload.data.summaryBase.totalRowsDetected,
          parsedPayload.data.rows.length
        ),
        warnings,
      },
    },
  };
}

async function applyUnitImport({
  behavior,
  condoId,
  parsedWorkbook,
}: {
  behavior: ExistingUnitImportBehavior;
  condoId: string;
  parsedWorkbook: ParsedWorkbook;
}): Promise<UnitImportAnalysis> {
  if (parsedWorkbook.rows.length === 0) {
    throw new Error("Aucune unité valide trouvée dans le fichier.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const buildingId = await resolveImportBuildingId(tx, condoId);
    const condo = await tx.condo.findUnique({
      where: { id: condoId },
      select: { parkingShareValue: true },
    });
    const existingUnits = await tx.unit.findMany({
      where: {
        deletedAt: null,
        building: {
          condoId,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        number: true,
      },
    });
    const { duplicateNumbers, unitMap } = buildExistingUnitMap(existingUnits);

    let createdUnits = 0;
    let updatedUnits = 0;

    for (const row of parsedWorkbook.rows) {
      const existingUnit = unitMap.get(row.unitNumber);

      if (existingUnit) {
        if (behavior === "update") {
          const data = buildUpdateData(row);

          if (Object.keys(data).length > 0) {
            await tx.unit.update({
              where: { id: existingUnit.id },
              data,
            });
            updatedUnits += 1;
          }
        }

        continue;
      }

      const unit = await tx.unit.create({
        data: buildCreateData(row, buildingId),
        select: {
          id: true,
          number: true,
        },
      });

      unitMap.set(unit.number, unit);
      createdUnits += 1;
    }

    return {
      createdUnits,
      duplicateNumbers,
      existingUnitNumbers: new Set(
        existingUnits.map((unit) => unit.number)
      ),
      parkingShareValue: Number(condo?.parkingShareValue ?? 0),
      updatedUnits,
    };
  });

  const warnings = [...parsedWorkbook.summaryBase.warnings];

  if (result.duplicateNumbers.size > 0) {
    pushWarning(
      warnings,
      `Doublons déjà présents en base: ${Array.from(
        result.duplicateNumbers
      ).join(", ")}. La première unité trouvée a été utilisée.`
    );
  }

  const summary = buildSummary({
    behavior,
    existingUnitNumbers: result.existingUnitNumbers,
    parsedWorkbook: {
      ...parsedWorkbook,
      summaryBase: {
        ...parsedWorkbook.summaryBase,
        warnings,
      },
    },
  });

  summary.createdUnits = result.createdUnits;
  summary.updatedUnits = result.updatedUnits;

  return {
    previewRows: buildPreviewRows({
      behavior,
      existingUnitNumbers: result.existingUnitNumbers,
      parkingShareValue: result.parkingShareValue,
      rows: parsedWorkbook.rows,
    }),
    summary,
  };
}

export async function importUnitWorkbook({
  behavior,
  buffer,
  condoId,
}: {
  behavior: ExistingUnitImportBehavior;
  buffer: Buffer;
  condoId: string;
}): Promise<UnitImportAnalysis> {
  const parsedWorkbook = await readWorkbook(buffer);

  return applyUnitImport({ behavior, condoId, parsedWorkbook });
}

export async function confirmUnitImportPayload({
  condoId,
  payload,
}: {
  condoId: string;
  payload: UnitImportPayload;
}): Promise<UnitImportAnalysis> {
  const { behavior, parsedWorkbook } = parseUnitImportPayload(payload);

  return applyUnitImport({ behavior, condoId, parsedWorkbook });
}
