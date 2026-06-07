import { z } from "zod";

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

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.").optional());

const nonNegativeDecimal = z.preprocess((value) => {
  if (typeof value !== "string") {
    return "0";
  }

  const normalized = value.trim().replace(",", ".");

  return normalized.length > 0 ? normalized : "0";
}, z.string().regex(/^\d+(\.\d+)?$/, "Entrez un nombre positif ou 0."));

export const condoInformationFormSchema = z.object({
  address: optionalText,
  city: optionalShortText,
  fiscalYearEndDate: optionalDate,
  name: z
    .string()
    .trim()
    .min(1, "Le nom de la copropriété est obligatoire.")
    .max(160, "Le nom de la copropriété est trop long."),
  parkingShareValue: nonNegativeDecimal,
  postalCode: optionalShortText,
  province: optionalShortText,
});

export type CondoInformationFormInput = z.infer<
  typeof condoInformationFormSchema
>;

export function parseCondoInformationFormData(formData: FormData) {
  return condoInformationFormSchema.safeParse(Object.fromEntries(formData));
}

export const createCondoFormSchema = condoInformationFormSchema
  .extend({
    fiscalYearStartDate: optionalDate,
  })
  .superRefine((input, context) => {
    if (!input.fiscalYearStartDate || !input.fiscalYearEndDate) {
      return;
    }

    const startDate = new Date(`${input.fiscalYearStartDate}T00:00:00`);
    const endDate = new Date(`${input.fiscalYearEndDate}T00:00:00`);

    if (endDate.getTime() < startDate.getTime()) {
      context.addIssue({
        code: "custom",
        message:
          "La date de fin d’année financière doit être après la date de début.",
        path: ["fiscalYearEndDate"],
      });
    }
  });

export type CreateCondoFormInput = z.infer<typeof createCondoFormSchema>;

export function parseCreateCondoFormData(formData: FormData) {
  return createCondoFormSchema.safeParse(Object.fromEntries(formData));
}
