import { z } from "zod";

export const unitOccupancyStatusSchema = z.enum([
  "OWNER_OCCUPIED",
  "NON_OWNER_OCCUPIED",
  "RENTED",
  "VACANT",
]);

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(500).optional());

const optionalShortText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(120).optional());

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().email("Le courriel du propriétaire est invalide.").optional());

const optionalDecimal = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(",", ".");

  return normalized.length > 0 ? normalized : undefined;
}, z.string().regex(/^\d+(\.\d+)?$/, "Entrez un nombre positif.").optional());

const optionalPercentDecimal = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(",", ".");

  return normalized.length > 0 ? normalized : undefined;
}, z.string().regex(/^\d+(\.\d+)?$/, "Entrez un pourcentage positif.").transform((value) => String(Number(value) / 100)).optional());

const optionalInteger = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().regex(/^\d+$/, "Entrez un nombre entier positif.").transform(Number).optional());

const optionalFloat = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(",", ".");

  return normalized.length > 0 ? normalized : undefined;
}, z.string().regex(/^\d+(\.\d+)?$/, "Entrez un nombre positif.").transform(Number).optional());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.").optional());

const checkboxBoolean = z.preprocess(
  (value) => value === "true" || value === "on",
  z.boolean()
);

export const unitFormSchema = z.object({
  bathroomCount: optionalFloat,
  buildingId: optionalShortText,
  floor: optionalShortText,
  hasAirConditioning: checkboxBoolean,
  hasFireplace: checkboxBoolean,
  insuranceRenewalDate: optionalDate,
  mobile: optionalShortText,
  monthlyCondoFee: optionalDecimal,
  notes: optionalText,
  occupancyStatus: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    return value;
  }, unitOccupancyStatusSchema.optional()),
  ownerEmail: optionalEmail,
  ownerName: optionalShortText,
  ownerPhone: optionalShortText,
  parkingCount: optionalInteger,
  parkingSpace: optionalShortText,
  quotePartOther: optionalPercentDecimal,
  roomCount: optionalShortText,
  sharePercentage: optionalPercentDecimal,
  squareFeet: optionalInteger,
  storageLocker: optionalShortText,
  unitNumber: z
    .string()
    .trim()
    .min(1, "Le numéro d’unité est obligatoire.")
    .max(60, "Le numéro d’unité est trop long."),
  waterHeaterDate: optionalDate,
});

export type UnitFormInput = z.infer<typeof unitFormSchema>;

export function parseUnitFormData(formData: FormData) {
  return unitFormSchema.safeParse(Object.fromEntries(formData));
}

const currentYear = new Date().getFullYear();

export const unitCondoFeeFormSchema = z.object({
  annualAmount: z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalized = value.trim().replace(",", ".");

    return normalized.length > 0 ? normalized : undefined;
  }, z.string({ error: "Le montant annuel est obligatoire." }).regex(/^\d+(\.\d{1,2})?$/, "Entrez un montant positif valide.")),
  feeId: optionalShortText,
  unitId: z.string().trim().min(1, "L’unité est obligatoire."),
  year: z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? Number(trimmed) : undefined;
  }, z.number({ error: "L’année est obligatoire." }).int("L’année doit être un nombre entier.").min(1900, "L’année doit être 1900 ou plus.").max(currentYear + 10, `L’année ne peut pas dépasser ${currentYear + 10}.`)),
});

export type UnitCondoFeeFormInput = z.infer<typeof unitCondoFeeFormSchema>;

export function parseUnitCondoFeeFormData(formData: FormData) {
  return unitCondoFeeFormSchema.safeParse(Object.fromEntries(formData));
}
