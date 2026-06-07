import ExcelJS from "exceljs";

import { createPlannedDate, parseMaintenanceMonth } from "./maintenance-date.utils";
import { parseMaintenanceFrequency } from "./maintenance-frequency.utils";
import type {
  MaintenanceImportPayload,
  MaintenanceImportRow,
  MaintenanceImportSummary,
  MaintenanceType,
} from "./maintenance-import.types";

const SHORT_TERM_SHEET = "Entretien 5 ans -";
const LONG_TERM_SHEET = "Entretien 6 ans +";
const IGNORED_SHEETS = new Set(["FP+", "Scénario FP+"]);
const FIRST_SCHEDULE_COLUMN = 8;
const MONTHS_PER_YEAR = 12;
const ELEMENT_CODE_PATTERN = /^\d+(?:\.\d+)+[a-z]?$/i;
const CATEGORY_PATTERN = /^\d+$/;

type CategoryContext = {
  categoryName: string | null;
  categoryNumber: string | null;
};

type YearBlock = {
  column: number;
  year: number;
};

function cellText(row: ExcelJS.Row, column: number) {
  const value = row.getCell(column).value;

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => ("text" in part ? part.text : ""))
        .join("")
        .trim();
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
  }

  return String(value).trim();
}

function optionalCellText(row: ExcelJS.Row, column: number) {
  const value = cellText(row, column);
  return value ? value : null;
}

function isCategoryRow(row: ExcelJS.Row) {
  const columnA = cellText(row, 1);
  const columnB = cellText(row, 2);
  const description = cellText(row, 3);

  return CATEGORY_PATTERN.test(columnA) && Boolean(columnB) && !description;
}

function isTaskRow(row: ExcelJS.Row) {
  return ELEMENT_CODE_PATTERN.test(cellText(row, 1));
}

function colorToRgb(color: Partial<ExcelJS.Color> | undefined) {
  const argb = color?.argb;

  if (!argb) {
    return null;
  }

  const hex = argb.length === 8 ? argb.slice(2) : argb;

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }

  return {
    blue: Number.parseInt(hex.slice(4, 6), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    red: Number.parseInt(hex.slice(0, 2), 16),
  };
}

export function isGreenFill(cell: ExcelJS.Cell) {
  const fill = cell.fill;

  if (!fill || fill.type !== "pattern") {
    return false;
  }

  const colors = [fill.fgColor, fill.bgColor]
    .map(colorToRgb)
    .filter((color): color is NonNullable<ReturnType<typeof colorToRgb>> =>
      Boolean(color)
    );

  return colors.some(
    (color) =>
      color.green >= 110 &&
      color.green > color.red * 1.25 &&
      color.green > color.blue * 1.1
  );
}

function detectYearBlocks(worksheet: ExcelJS.Worksheet): YearBlock[] {
  const blocks = new Map<number, number>();

  for (let rowNumber = 1; rowNumber <= Math.min(20, worksheet.rowCount); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    for (
      let column = FIRST_SCHEDULE_COLUMN;
      column <= worksheet.columnCount;
      column += 1
    ) {
      const text = cellText(row, column);
      const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);

      if (yearMatch && !blocks.has(column)) {
        blocks.set(column, Number(yearMatch[1]));
      }
    }
  }

  const detected = Array.from(blocks, ([column, year]) => ({ column, year }))
    .sort((left, right) => left.column - right.column);

  if (detected.length > 0) {
    return detected;
  }

  const currentYear = new Date().getFullYear();
  const fallbackBlocks: YearBlock[] = [];

  for (
    let column = FIRST_SCHEDULE_COLUMN, year = currentYear;
    column <= worksheet.columnCount;
    column += MONTHS_PER_YEAR, year += 1
  ) {
    fallbackBlocks.push({ column, year });
  }

  return fallbackBlocks;
}

function resolveCalendarDate(column: number, yearBlocks: YearBlock[]) {
  const block = [...yearBlocks]
    .reverse()
    .find((candidate) => column >= candidate.column);

  if (!block) {
    return null;
  }

  const monthOffset = column - block.column;

  if (monthOffset < 0 || monthOffset >= MONTHS_PER_YEAR) {
    return null;
  }

  return {
    plannedMonth: monthOffset + 1,
    plannedYear: block.year,
  };
}

function createSummary(): MaintenanceImportSummary {
  return {
    createdItems: 0,
    createdOccurrences: 0,
    duplicateItems: 0,
    duplicateOccurrences: 0,
    errors: [],
    ignoredSheets: [],
    longTermTasks: 0,
    shortTermTasks: 0,
    warnings: [],
  };
}

function parseWorksheet(
  worksheet: ExcelJS.Worksheet,
  maintenanceType: MaintenanceType,
  summary: MaintenanceImportSummary
) {
  const rows: MaintenanceImportRow[] = [];
  const yearBlocks = maintenanceType === "court_terme"
    ? detectYearBlocks(worksheet)
    : [];
  let category: CategoryContext = {
    categoryName: null,
    categoryNumber: null,
  };

  worksheet.eachRow((row, rowNumber) => {
    if (isCategoryRow(row)) {
      category = {
        categoryName: cellText(row, 2),
        categoryNumber: cellText(row, 1),
      };
      return;
    }

    if (!isTaskRow(row)) {
      return;
    }

    const description = cellText(row, 3);
    const elementCode = cellText(row, 1);
    const frequencyText = optionalCellText(row, 4);
    const monthText = optionalCellText(row, 5);
    const parsedFrequency = parseMaintenanceFrequency(frequencyText);

    if (!description) {
      summary.errors.push(
        `${worksheet.name} ligne ${rowNumber}: description manquante.`
      );
      return;
    }

    if (!category.categoryNumber || !category.categoryName) {
      summary.errors.push(
        `${worksheet.name} ligne ${rowNumber}: tâche sans catégorie.`
      );
    }

    if (monthText && !parseMaintenanceMonth(monthText)) {
      summary.errors.push(`${worksheet.name} ligne ${rowNumber}: mois invalide.`);
    }

    if (parsedFrequency.warning) {
      summary.warnings.push(
        `${worksheet.name} ligne ${rowNumber}: ${parsedFrequency.warning}`
      );
    }

    const occurrences =
      maintenanceType === "court_terme"
        ? Array.from({ length: Math.max(0, worksheet.columnCount - FIRST_SCHEDULE_COLUMN + 1) })
            .map((_, index) => FIRST_SCHEDULE_COLUMN + index)
            .filter((column) => isGreenFill(row.getCell(column)))
            .map((column) => resolveCalendarDate(column, yearBlocks))
            .filter(
              (
                occurrence
              ): occurrence is { plannedMonth: number; plannedYear: number } =>
                Boolean(occurrence)
            )
            .map((occurrence) => ({
              ...occurrence,
              plannedDate: createPlannedDate(
                occurrence.plannedYear,
                occurrence.plannedMonth
              ).toISOString(),
            }))
        : [];

    rows.push({
      categoryName: category.categoryName,
      categoryNumber: category.categoryNumber,
      componentCode: optionalCellText(row, 2),
      description,
      elementCode,
      frequencyInterval: parsedFrequency.frequencyInterval,
      frequencyText,
      frequencyType: parsedFrequency.frequencyType,
      frequencyUnit: parsedFrequency.frequencyUnit,
      maintenanceType,
      monthText,
      occurrences,
      paidBy: optionalCellText(row, 7),
      performedBy: optionalCellText(row, 6),
      sourceRow: rowNumber,
      sourceSheet: worksheet.name,
    });
  });

  return rows;
}

export async function parseMaintenanceImportWorkbook(
  buffer: Buffer
): Promise<MaintenanceImportPayload> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
  );

  const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const summary = createSummary();

  console.log("[maintenance-import] Onglets détectés", sheetNames);

  for (const sheetName of sheetNames) {
    if (IGNORED_SHEETS.has(sheetName)) {
      summary.ignoredSheets.push(sheetName);
    }
  }

  const shortTermWorksheet = workbook.getWorksheet(SHORT_TERM_SHEET);
  const longTermWorksheet = workbook.getWorksheet(LONG_TERM_SHEET);
  const rows: MaintenanceImportRow[] = [];

  if (shortTermWorksheet) {
    rows.push(...parseWorksheet(shortTermWorksheet, "court_terme", summary));
  } else {
    summary.errors.push(`L’onglet “${SHORT_TERM_SHEET}” est introuvable.`);
  }

  if (longTermWorksheet) {
    rows.push(...parseWorksheet(longTermWorksheet, "long_terme", summary));
  } else {
    summary.warnings.push(`L’onglet “${LONG_TERM_SHEET}” est introuvable.`);
  }

  summary.shortTermTasks = rows.filter(
    (row) => row.maintenanceType === "court_terme"
  ).length;
  summary.longTermTasks = rows.filter(
    (row) => row.maintenanceType === "long_terme"
  ).length;

  console.log("[maintenance-import] Analyse terminée", {
    errors: summary.errors.length,
    ignoredSheets: summary.ignoredSheets,
    longTermTasks: summary.longTermTasks,
    occurrences: rows.reduce((total, row) => total + row.occurrences.length, 0),
    shortTermTasks: summary.shortTermTasks,
    warnings: summary.warnings.length,
  });

  return {
    rows,
    summary,
  };
}
