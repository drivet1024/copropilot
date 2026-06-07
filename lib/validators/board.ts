import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(200).optional());

const dateField = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.");

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.").optional());

export const boardFormSchema = z.object({
  name: optionalText,
  startDate: dateField("La date de début est obligatoire."),
  endDate: optionalDate,
});

export type BoardFormInput = z.infer<typeof boardFormSchema>;

export function parseBoardFormData(formData: FormData) {
  return boardFormSchema.safeParse(Object.fromEntries(formData));
}
