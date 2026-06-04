"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";
import type { CurrentCondo } from "@/lib/data/condos";
import { createUnit, deleteUnit, updateUnit } from "@/lib/data/units";
import type { UnitMutationInput } from "@/lib/data/units";
import { parseUnitFormData } from "@/lib/validators/unit";

export type UnitActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const MANAGE_UNIT_ROLES = ["MASTER_USER", "CONDO_MANAGER"];

type WritableCondoContext =
  | { condo: CurrentCondo }
  | { error: UnitActionResult };

type UnitValidationContext =
  | { input: UnitMutationInput }
  | { error: UnitActionResult };

function canManageUnits(role: string) {
  return MANAGE_UNIT_ROLES.includes(role);
}

async function getWritableCondo(): Promise<WritableCondoContext> {
  const user = await requireUser();

  // TODO: Replace role allowlist with granular unit management permissions.
  if (!canManageUnits(user.role)) {
    return {
      error: {
        ok: false,
        message: "Vous n’avez pas les droits requis pour modifier les unités.",
      } satisfies UnitActionResult,
    };
  }

  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return {
      error: {
        ok: false,
        message: "Aucune copropriété configurée.",
      } satisfies UnitActionResult,
    };
  }

  return { condo };
}

function getValidationError(formData: FormData): UnitValidationContext {
  const parsed = parseUnitFormData(formData);

  if (parsed.success) {
    return { input: parsed.data };
  }

  return {
    error: {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    } satisfies UnitActionResult,
  };
}

function revalidateUnitViews() {
  revalidatePath("/condos/units");
  revalidatePath("/condos/payments");
  revalidatePath("/condos");
}

export async function createUnitAction(
  formData: FormData
): Promise<UnitActionResult> {
  const context = await getWritableCondo();

  if ("error" in context) {
    return context.error;
  }

  const validation = getValidationError(formData);

  if ("error" in validation) {
    return validation.error;
  }

  try {
    await createUnit(context.condo.id, validation.input);
    revalidateUnitViews();

    return {
      ok: true,
      message: "L’unité a été ajoutée.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d’ajouter l’unité.",
    };
  }
}

export async function updateUnitAction(
  unitId: string,
  formData: FormData
): Promise<UnitActionResult> {
  const context = await getWritableCondo();

  if ("error" in context) {
    return context.error;
  }

  const validation = getValidationError(formData);

  if ("error" in validation) {
    return validation.error;
  }

  try {
    await updateUnit(unitId, context.condo.id, validation.input);
    revalidateUnitViews();

    return {
      ok: true,
      message: "L’unité a été modifiée.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier l’unité.",
    };
  }
}

export async function deleteUnitAction(
  unitId: string
): Promise<UnitActionResult> {
  const context = await getWritableCondo();

  if ("error" in context) {
    return context.error;
  }

  try {
    await deleteUnit(unitId, context.condo.id);
    revalidateUnitViews();

    return {
      ok: true,
      message: "L’unité a été retirée.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de retirer l’unité.",
    };
  }
}
