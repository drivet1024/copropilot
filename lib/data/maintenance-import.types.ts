export type MaintenanceType = "court_terme" | "long_terme";

export type MaintenanceImportOccurrence = {
  plannedDate: string;
  plannedMonth: number;
  plannedYear: number;
};

export type MaintenanceImportRow = {
  categoryName: string | null;
  categoryNumber: string | null;
  componentCode: string | null;
  description: string;
  elementCode: string;
  frequencyInterval: number | null;
  frequencyText: string | null;
  frequencyType: string | null;
  frequencyUnit: string | null;
  maintenanceType: MaintenanceType;
  monthText: string | null;
  occurrences: MaintenanceImportOccurrence[];
  paidBy: string | null;
  performedBy: string | null;
  sourceRow: number;
  sourceSheet: string;
};

export type MaintenanceImportPreviewRow = {
  category: string;
  componentCode: string;
  description: string;
  elementCode: string;
  frequency: string;
  maintenanceType: string;
  month: string;
  occurrenceCount: number;
  paidBy: string;
  performedBy: string;
};

export type MaintenanceImportSummary = {
  createdItems: number;
  createdOccurrences: number;
  duplicateItems: number;
  duplicateOccurrences: number;
  errors: string[];
  ignoredSheets: string[];
  longTermTasks: number;
  shortTermTasks: number;
  warnings: string[];
};

export type MaintenanceImportPayload = {
  rows: MaintenanceImportRow[];
  summary: MaintenanceImportSummary;
};
