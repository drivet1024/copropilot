"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";
import type { CurrentCondo } from "@/lib/data/condos";
import {
  createBoard,
  createBoardMember,
  deleteBoardMember,
  endBoard,
  endBoardMember,
  updateBoardMember,
  type BoardMemberMutationInput,
  type BoardMutationInput,
} from "@/lib/data/board";
import { parseBoardFormData } from "@/lib/validators/board";
import { parseBoardMemberFormData } from "@/lib/validators/board-member";

export type BoardActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const MANAGE_BOARD_ROLES = ["MASTER_USER", "CONDO_MANAGER"];

type WritableBoardContext =
  | { condo: CurrentCondo }
  | { error: BoardActionResult };

function canManageBoard(role: string) {
  return MANAGE_BOARD_ROLES.includes(role);
}

async function getWritableBoardContext(): Promise<WritableBoardContext> {
  const user = await requireUser();

  if (!canManageBoard(user.role)) {
    return {
      error: {
        ok: false,
        message:
          "Vous n’avez pas les droits requis pour modifier le conseil d’administration.",
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

  return { condo };
}

function revalidateBoardViews() {
  revalidatePath("/condos/board");
}

// ---- Conseil ----

export async function createBoardAction(
  formData: FormData
): Promise<BoardActionResult> {
  const context = await getWritableBoardContext();

  if ("error" in context) {
    return context.error;
  }

  const parsed = parseBoardFormData(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
  };
  }

  try {
    await createBoard(context.condo.id, parsed.data);
    revalidateBoardViews();

    return {
      ok: true,
      message: "Le conseil a été créé.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer ce conseil.",
    };
  }
}

export async function endBoardAction(
  formData: FormData
): Promise<BoardActionResult> {
  const context = await getWritableBoardContext();

  if ("error" in context) {
    return context.error;
  }

  const boardId = formData.get("boardId")?.toString() ?? "";
  const endDate = formData.get("endDate")?.toString() ?? "";

  if (!boardId) {
    return { ok: false, message: "Identifiant du conseil manquant." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return { ok: false, message: "La date de fin est invalide." };
  }

  try {
    await endBoard({
      condoId: context.condo.id,
      boardId,
      endDate,
      endMembersAtSameDate: true,
    });
    revalidateBoardViews();

    return {
      ok: true,
      message: "Le conseil a été terminé.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de terminer ce conseil.",
    };
  }
}

// ---- Membre du conseil ----

export async function createBoardMemberAction(
  formData: FormData
): Promise<BoardActionResult> {
  const context = await getWritableBoardContext();

  if ("error" in context) {
    return context.error;
  }

  const parsed = parseBoardMemberFormData(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createBoardMember(context.condo.id, parsed.data);
    revalidateBoardViews();

    return {
      ok: true,
      message: "Le membre du conseil a été ajouté.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d’ajouter ce membre.",
    };
  }
}

export async function updateBoardMemberAction(
  membershipId: string,
  formData: FormData
): Promise<BoardActionResult> {
  const context = await getWritableBoardContext();

  if ("error" in context) {
    return context.error;
  }

  const parsed = parseBoardMemberFormData(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateBoardMember(membershipId, context.condo.id, parsed.data);
    revalidateBoardViews();

    return {
      ok: true,
      message: "Le membre du conseil a été modifié.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier ce membre.",
    };
  }
}

export async function endBoardMemberAction(
  membershipId: string,
  endDate: string
): Promise<BoardActionResult> {
  const context = await getWritableBoardContext();

  if ("error" in context) {
    return context.error;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return { ok: false, message: "La date de fin est invalide." };
  }

  try {
    await endBoardMember(membershipId, context.condo.id, endDate);
    revalidateBoardViews();

    return {
      ok: true,
      message: "Le mandat du membre a été terminé.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de terminer ce mandat.",
    };
  }
}

export async function deleteBoardMemberAction(
  membershipId: string
): Promise<BoardActionResult> {
  const context = await getWritableBoardContext();

  if ("error" in context) {
    return context.error;
  }

  try {
    await deleteBoardMember(membershipId, context.condo.id);
    revalidateBoardViews();

    return {
      ok: true,
      message: "Le membre du conseil a été retiré.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de retirer ce membre.",
    };
  }
}
