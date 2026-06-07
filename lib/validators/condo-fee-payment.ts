import { z } from "zod";

export const paymentMethodSchema = z.enum([
  "CHEQUE",
  "BANK_TRANSFER",
  "PRE_AUTHORIZED",
  "CASH",
  "OTHER",
]);

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(500).optional());

const requiredPositiveDecimal = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(",", ".");
}, z.string().regex(/^\d+(\.\d+)?$/, "Entrez un montant valide."));

export const condoFeePaymentFormSchema = z
  .object({
    amount: requiredPositiveDecimal.refine(
      (value) => Number(value) > 0,
      "Le montant doit être supérieur à 0."
    ),
    chequeNumber: optionalText,
    notes: optionalText,
    paymentDate: z
      .string()
      .trim()
      .min(1, "La date du paiement est obligatoire.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La date du paiement est invalide."),
    paymentMonth: z
      .string()
      .trim()
      .min(1, "Le mois de référence est obligatoire.")
      .regex(/^[0-9]{4}-[0-9]{2}$/, "Le mois de référence est invalide."),
    paymentMethod: paymentMethodSchema,
    unitId: z.string().trim().min(1, "Sélectionnez une unité."),
  })
  .superRefine((value, context) => {
    if (value.paymentMethod === "CHEQUE" && !value.chequeNumber) {
      context.addIssue({
        code: "custom",
        message: "Le numéro du chèque est obligatoire.",
        path: ["chequeNumber"],
      });
    }
  });

export type CondoFeePaymentFormInput = z.infer<
  typeof condoFeePaymentFormSchema
>;

export function parseCondoFeePaymentFormData(formData: FormData) {
  return condoFeePaymentFormSchema.safeParse(Object.fromEntries(formData));
}

const condoFeePaymentBatchItemSchema = z.object({
  unitId: z.string().trim().min(1, "Sélectionnez une unité."),
  amount: requiredPositiveDecimal.refine(
    (value) => Number(value) > 0,
    "Le montant doit être supérieur à 0."
  ),
  note: optionalText,
});

export const condoFeeMultiplePaymentSchema = z
  .object({
    fiscalYear: z.string().trim().min(1, "L’année financière est obligatoire."),
    month: z.string()
      .trim()
      .min(1, "Le mois est obligatoire.")
      .regex(/^[0-9]{4}-[0-9]{2}$/, "Le mois est invalide."),
    referenceYear: z.preprocess(
      (value) => (typeof value === "string" ? Number(value) : value),
      z.number().int().min(2020, "L’année de référence est invalide.")
    ),
    paymentDate: z
      .string()
      .trim()
      .min(1, "La date du paiement est obligatoire.")
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "La date du paiement est invalide."),
    paymentMethod: paymentMethodSchema,
    chequeNumber: optionalText,
    notes: optionalText,
    payments: z
      .array(condoFeePaymentBatchItemSchema)
      .min(1, "Sélectionnez au moins une unité."),
  })
  .superRefine((value, context) => {
    if (value.paymentMethod === "CHEQUE" && !value.chequeNumber) {
      context.addIssue({
        code: "custom",
        message: "Le numéro du chèque est obligatoire.",
        path: ["chequeNumber"],
      });
    }
  });

export type CondoFeePaymentMultipleFormInput = z.infer<
  typeof condoFeeMultiplePaymentSchema
>;

export function parseCondoFeeMultiplePaymentInput(input: unknown) {
  return condoFeeMultiplePaymentSchema.safeParse(input);
}
