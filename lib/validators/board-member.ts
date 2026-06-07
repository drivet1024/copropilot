import { z } from "zod";

import { condoBoardRoleSchema } from "@/lib/validators/board-membership";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(1000).optional());

const optionalId = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date est invalide.").optional());

export const boardMemberFormSchema = z.object({
  boardId: z.string().trim().min(1, "Le conseil parent est requis."),
  personName: z
    .string()
    .trim()
    .min(1, "Le nom de la personne est obligatoire.")
    .max(160, "Le nom est trop long."),
  role: condoBoardRoleSchema,
  unitId: optionalId,
  startDate: optionalDate,
  endDate: optionalDate,
  notes: optionalText,
});

export type BoardMemberFormInput = z.infer<typeof boardMemberFormSchema>;

export function parseBoardMemberFormData(formData: FormData) {
  return boardMemberFormSchema.safeParse(Object.fromEntries(formData));
}
