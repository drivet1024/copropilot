export type ParsedFrequency = {
  frequencyInterval: number | null;
  frequencyType: string | null;
  frequencyUnit: string | null;
  warning?: string;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function parseMaintenanceFrequency(
  frequencyText: string | null
): ParsedFrequency {
  if (!frequencyText) {
    return {
      frequencyInterval: null,
      frequencyType: null,
      frequencyUnit: null,
    };
  }

  const normalized = normalizeText(frequencyText);

  if (
    normalized === "une fois par annee" ||
    normalized === "au moins une fois par annee"
  ) {
    return {
      frequencyInterval: 1,
      frequencyType: "recurring",
      frequencyUnit: "year",
    };
  }

  const yearlyMatch = normalized.match(/^tous les (\d+) ans?$/);
  if (yearlyMatch) {
    return {
      frequencyInterval: Number(yearlyMatch[1]),
      frequencyType: "recurring",
      frequencyUnit: "year",
    };
  }

  if (normalized === "une fois par mois") {
    return {
      frequencyInterval: 1,
      frequencyType: "recurring",
      frequencyUnit: "month",
    };
  }

  if (normalized === "deux fois par annee") {
    return {
      frequencyInterval: 6,
      frequencyType: "recurring",
      frequencyUnit: "month",
      warning:
        "La fréquence “Deux fois par année” a été normalisée à tous les 6 mois.",
    };
  }

  return {
    frequencyInterval: null,
    frequencyType: null,
    frequencyUnit: null,
    warning: `Fréquence non reconnue: ${frequencyText}.`,
  };
}
