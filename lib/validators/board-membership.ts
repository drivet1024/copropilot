import { z } from "zod";

export const condoBoardRoleSchema = z.enum([
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "SECRETARY",
  "DIRECTOR",
]);

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(1000).optional());

const optionalId = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const dateField = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.");

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.").optional());

export const boardMembershipFormSchema = z
  .object({
    endDate: optionalDate,
    notes: optionalText,
    personName: z
      .string()
      .trim()
      .min(1, "Le nom de la personne est obligatoire.")
      .max(160, "Le nom de la personne est trop long."),
    role: condoBoardRoleSchema,
    startDate: dateField("La date de début est obligatoire."),
    unitId: optionalId,
  })
  .superRefine((value, context) => {
    if (!value.endDate) {
      return;
    }

    if (value.endDate < value.startDate) {
      context.addIssue({
        code: "custom",
        message: "La date de fin doit être après ou égale à la date de début.",
        path: ["endDate"],
      });
    }
  });

export type BoardMembershipFormInput = z.infer<
  typeof boardMembershipFormSchema
>;

export function parseBoardMembershipFormData(formData: FormData) {
  return boardMembershipFormSchema.safeParse(Object.fromEntries(formData));
}
