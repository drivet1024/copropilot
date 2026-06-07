"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";
import type { CurrentCondo } from "@/lib/data/condos";
import {
  createCondoFeePayment,
  createCondoFeePayments,
  deleteCondoFeePayment,
  setCondoFeePaymentMonthPaid,
  updateCondoFeePayment,
} from "@/lib/data/condo-fee-payments";
import type {
  CondoFeePaymentBatchInput,
  CondoFeePaymentMutationInput,
} from "@/lib/data/condo-fee-payments";
import {
  parseCondoFeePaymentFormData,
  parseCondoFeeMultiplePaymentInput,
} from "@/lib/validators/condo-fee-payment";

export type CondoFeePaymentActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const RECORD_PAYMENT_ROLES = ["MASTER_USER", "CONDO_MANAGER"];

type WritablePaymentContext =
  | { condo: CurrentCondo; userId: string }
  | { error: CondoFeePaymentActionResult };

type PaymentValidationContext =
  | { input: CondoFeePaymentMutationInput }
  | { error: CondoFeePaymentActionResult };

function canRecordPayments(role: string) {
  return RECORD_PAYMENT_ROLES.includes(role);
}

async function getWritablePaymentContext(): Promise<WritablePaymentContext> {
  const user = await requireUser();

  // TODO: Replace role allowlist with tenant, condo and payment permission checks.
  if (!canRecordPayments(user.role)) {
    return {
      error: {
        ok: false,
        message: "Vous n’avez pas les droits requis pour enregistrer un paiement.",
      },
    };
  }

  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return {
      error: {
        ok: false,
        message: "Aucune copropriété configurée.",
      },
    };
  }

  return { condo, userId: user.id };
}

function validatePayment(formData: FormData): PaymentValidationContext {
  const parsed = parseCondoFeePaymentFormData(formData);

  if (parsed.success) {
    return { input: parsed.data };
  }

  return {
    error: {
      ok: false,
      message: "Le paiement n’a pas pu être enregistré.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    },
  };
}

function revalidatePaymentViews() {
  revalidatePath("/condos/payments");
  revalidatePath("/condos");
}

export async function createCondoFeePaymentAction(
  formData: FormData
): Promise<CondoFeePaymentActionResult> {
  const context = await getWritablePaymentContext();

  if ("error" in context) {
    return context.error;
  }

  const validation = validatePayment(formData);

  if ("error" in validation) {
    return validation.error;
  }

  try {
    await createCondoFeePayment(
      context.condo.id,
      validation.input,
      context.userId
    );
    revalidatePaymentViews();

    return {
      ok: true,
      message: "Le paiement a été enregistré.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Le paiement n’a pas pu être enregistré.",
    };
  }
}

export async function createCondoFeePaymentsAction(
  payload: CondoFeePaymentBatchInput
): Promise<CondoFeePaymentActionResult> {
  const context = await getWritablePaymentContext();

  if ("error" in context) {
    return context.error;
  }

  const validation = parseCondoFeeMultiplePaymentInput(payload);

  if (!validation.success) {
    return {
      ok: false,
      message: "Les paiements n’ont pas pu être enregistrés.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await createCondoFeePayments(
      context.condo.id,
      validation.data,
      context.userId
    );
    revalidatePaymentViews();

    return {
      ok: true,
      message: "Les paiements ont été enregistrés.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Les paiements n’ont pas pu être enregistrés.",
    };
  }
}

export async function updateCondoFeePaymentAction(
  paymentId: string,
  formData: FormData
): Promise<CondoFeePaymentActionResult> {
  const context = await getWritablePaymentContext();

  if ("error" in context) {
    return context.error;
  }

  const validation = validatePayment(formData);

  if ("error" in validation) {
    return validation.error;
  }

  try {
    await updateCondoFeePayment(
      paymentId,
      context.condo.id,
      validation.input
    );
    revalidatePaymentViews();

    return {
      ok: true,
      message: "Le paiement a été modifié.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Le paiement n’a pas pu être modifié.",
    };
  }
}

export async function deleteCondoFeePaymentAction(
  paymentId: string
): Promise<CondoFeePaymentActionResult> {
  const context = await getWritablePaymentContext();

  if ("error" in context) {
    return context.error;
  }

  try {
    await deleteCondoFeePayment(paymentId, context.condo.id);
    revalidatePaymentViews();

    return {
      ok: true,
      message: "Le paiement a été effacé.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Le paiement n’a pas pu être effacé.",
    };
  }
}

export async function setCondoFeePaymentMonthPaidAction({
  isPaid,
  periodStart,
  unitId,
}: {
  isPaid: boolean;
  periodStart: string;
  unitId: string;
}): Promise<CondoFeePaymentActionResult> {
  const context = await getWritablePaymentContext();

  if ("error" in context) {
    return context.error;
  }

  try {
    await setCondoFeePaymentMonthPaid({
      condoId: context.condo.id,
      isPaid,
      periodStart,
      recordedById: context.userId,
      unitId,
    });
    revalidatePaymentViews();

    return {
      ok: true,
      message: isPaid ? "Le mois est marqué payé." : "Le mois est marqué impayé.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier ce paiement mensuel.",
    };
  }
}

