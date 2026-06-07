const MONTHS = new Map(
  [
    ["janvier", 1],
    ["fevrier", 2],
    ["février", 2],
    ["mars", 3],
    ["avril", 4],
    ["mai", 5],
    ["juin", 6],
    ["juillet", 7],
    ["aout", 8],
    ["août", 8],
    ["septembre", 9],
    ["octobre", 10],
    ["novembre", 11],
    ["decembre", 12],
    ["décembre", 12],
  ].map(([label, month]) => [label, month] as const)
);

export function parseMaintenanceMonth(monthText: string | null) {
  if (!monthText) {
    return null;
  }

  const normalized = monthText.trim().toLowerCase();
  return MONTHS.get(normalized) ?? null;
}

export function createPlannedDate(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}
