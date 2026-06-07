"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { canManageCondos } from "@/lib/auth/permissions";
import {
  createCondoForUser,
  getCurrentCondoForManager,
  updateCondoInformation,
} from "@/lib/data/condos";
import type {
  CondoInformationFormInput,
  CreateCondoFormInput,
} from "@/lib/validators/condo";
import {
  parseCondoInformationFormData,
  parseCreateCondoFormData,
} from "@/lib/validators/condo";

export type CondoInformationActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type CreateCondoActionResult = CondoInformationActionResult & {
  condo?: {
    id: string;
    name: string;
  };
};

type CondoValidationContext =
  | { input: CondoInformationFormInput }
  | { error: CondoInformationActionResult };

type CreateCondoValidationContext =
  | { input: CreateCondoFormInput }
  | { error: CreateCondoActionResult };

function validateCondoInformation(
  formData: FormData
): CondoValidationContext {
  const parsed = parseCondoInformationFormData(formData);

  if (parsed.success) {
    return { input: parsed.data };
  }

  return {
    error: {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    },
  };
}

function validateCreateCondo(formData: FormData): CreateCondoValidationContext {
  const parsed = parseCreateCondoFormData(formData);

  if (parsed.success) {
    return { input: parsed.data };
  }

  return {
    error: {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    },
  };
}

function revalidateCondoViews() {
  revalidatePath("/condos");
  revalidatePath("/condos/units");
  revalidatePath("/condos/board");
  revalidatePath("/condos/documents");
  revalidatePath("/condos/payments");
  revalidatePath("/condos/history");
}

export async function createCondoAction(
  formData: FormData
): Promise<CreateCondoActionResult> {
  const user = await requireUser();

  if (!canManageCondos(user.role)) {
    return {
      ok: false,
      message:
        "Vous n’avez pas les droits requis pour créer une copropriété.",
    };
  }

  const validation = validateCreateCondo(formData);

  if ("error" in validation) {
    return validation.error;
  }

  try {
    const condo = await createCondoForUser(user, validation.input);
    revalidateCondoViews();

    return {
      ok: true,
      message: `La copropriété « ${condo.name} » a été créée.`,
      condo: {
        id: condo.id,
        name: condo.name,
      },
    };
  } catch (error) {
    console.error("[createCondoAction] Échec de la création", error);

    return {
      ok: false,
      message:
        "Impossible de créer la copropriété pour le moment. Réessayez plus tard.",
    };
  }
}

export async function updateCondoInformationAction(
  formData: FormData
): Promise<CondoInformationActionResult> {
  const user = await requireUser();

  // TODO: Replace role allowlist with real condo information permission checks.
  if (!canManageCondos(user.role)) {
    return {
      ok: false,
      message:
        "Vous n’avez pas les droits requis pour modifier cette copropriété.",
    };
  }

  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return {
      ok: false,
      message: "Aucune copropriété configurée.",
    };
  }

  const validation = validateCondoInformation(formData);

  if ("error" in validation) {
    return validation.error;
  }

  try {
    await updateCondoInformation(condo.id, validation.input);
    revalidateCondoViews();

    return {
      ok: true,
      message: "Les informations de la copropriété ont été enregistrées.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer les informations de la copropriété.",
    };
  }
}
