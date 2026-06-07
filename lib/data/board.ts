import type { CondoBoardRole } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/session";
import { condoBoardRoleLabels, condoBoardRoleOrder } from "@/lib/board/roles";
import { prisma } from "@/lib/db/prisma";
import { getCurrentCondoForManager, type CurrentCondo } from "./condos";

// ---- Types exportés ----

export type BoardUnitOption = {
  id: string;
  ownerName: string;
  unitNumber: string;
};

export type BoardRow = {
  id: string;
  name: string;
  startDate: string;
  startDateDisplay: string;
  endDate: string | null;
  endDateDisplay: string;
  status: "ACTIVE" | "ENDED";
  memberCount: number;
};

export type BoardMemberRow = {
  id: string;
  boardId: string;
  personName: string;
  role: CondoBoardRole;
  roleLabel: string;
  unitId: string;
  unitLabel: string;
  startDate: string;
  startDateDisplay: string;
  endDate: string | null;
  endDateDisplay: string;
  status: "Actif" | "Terminé";
  notes: string;
};

export type CurrentCondoBoards = {
  condo: CurrentCondo;
  activeBoard: BoardWithMembers | null;
  historicalBoards: BoardWithMembers[];
  units: BoardUnitOption[];
};

export type BoardWithMembers = {
  id: string;
  name: string;
  startDate: string;
  startDateDisplay: string;
  endDate: string | null;
  endDateDisplay: string;
  formattedMembers: string;
  status: string;
  members: BoardMemberRow[];
};

export type BoardMutationInput = {
  name?: string;
  startDate: string;
  endDate?: string;
};

export type BoardMemberMutationInput = {
  boardId: string;
  unitId?: string;
  personName: string;
  role: CondoBoardRole;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

// ---- Helpers ----

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function toDateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatDate(value: Date | null) {
  return value ? dateFormatter.format(value) : "Aucune";
}

function formatHistoryDate(value: Date | null) {
  return value ? dateFormatter.format(value) : "Non précisée";
}

function toLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalDate(value: string | undefined) {
  return value ? toLocalDate(value) : null;
}

function getTodayStart(referenceDate = new Date()) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
}

function getUnitLabel(unit: { number: string; ownerName: string | null } | null) {
  if (!unit) {
    return "Non liée";
  }
  return unit.ownerName
    ? `Unité ${unit.number} - ${unit.ownerName}`
    : `Unité ${unit.number}`;
}

function getBoardRolePriority(role: CondoBoardRole) {
  const index = condoBoardRoleOrder.indexOf(role);

  return index === -1 ? 99 : index + 1;
}

function formatHistoricalRole(role: CondoBoardRole) {
  if (role === "VICE_PRESIDENT") {
    return "VP";
  }

  if (role === "DIRECTOR") {
    return "Administrateur";
  }

  return condoBoardRoleLabels[role];
}

function sortBoardMembers<T extends { personName: string; role: CondoBoardRole }>(
  members: T[]
) {
  return [...members].sort((a, b) => {
    const priorityDifference =
      getBoardRolePriority(a.role) - getBoardRolePriority(b.role);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.personName.localeCompare(b.personName, "fr-CA");
  });
}

function formatBoardMembersForHistory(
  members: { personName: string; role: CondoBoardRole }[]
) {
  const formattedMembers = sortBoardMembers(members).map(
    (member) => `${formatHistoricalRole(member.role)} : ${member.personName}`
  );

  return formattedMembers.length > 0
    ? formattedMembers.join(", ")
    : "Aucun membre";
}

function isBoardEnded(board: {
  endDate: Date | string | null;
  status: string;
}) {
  return board.status !== "ACTIVE" || Boolean(board.endDate);
}

// ---- Assertions ----

async function getCondoTenantId(condoId: string) {
  const condo = await prisma.condo.findUnique({
    where: { id: condoId },
    select: { organizationId: true },
  });
  if (!condo) throw new Error("Copropriété introuvable.");
  return condo.organizationId;
}

async function assertUnitBelongsToCondo(unitId: string, condoId: string) {
  const unit = await prisma.unit.findFirst({
    where: { deletedAt: null, id: unitId, building: { condoId } },
    select: { id: true },
  });
  if (!unit) {
    throw new Error("L’unité sélectionnée n’appartient pas à cette copropriété.");
  }
}

async function assertBoardBelongsToCondo(boardId: string, condoId: string) {
  const board = await prisma.condoBoard.findFirst({
    where: { condoCorporationId: condoId, id: boardId },
    select: { id: true },
  });
  if (!board) {
    throw new Error("Ce conseil est introuvable pour cette copropriété.");
  }
}

// ---- Requêtes ----

export async function getBoardUnitOptionsForCondo(
  condoId: string
): Promise<BoardUnitOption[]> {
  const units = await prisma.unit.findMany({
    where: { deletedAt: null, building: { condoId } },
    orderBy: [{ building: { name: "asc" } }, { number: "asc" }],
    select: { id: true, number: true, ownerName: true },
  });
  return units.map((unit) => ({
    id: unit.id,
    ownerName: unit.ownerName ?? "",
    unitNumber: unit.number,
  }));
}

async function getBoardsForCondo(
  condoId: string,
  referenceDate = new Date()
): Promise<BoardWithMembers[]> {
  const boards = await prisma.condoBoard.findMany({
    where: { condoCorporationId: condoId },
    include: {
      members: {
        where: { deletedAt: null },
        include: {
          unit: {
            select: { number: true, ownerName: true },
          },
        },
        orderBy: [{ role: "asc" }, { personName: "asc" }],
      },
    },
    orderBy: [{ startDate: "desc" }],
  });

  const today = getTodayStart(referenceDate);

  return boards.map((board) => {
    const sortedMembers = sortBoardMembers(board.members);

    return {
      id: board.id,
      name: board.name ?? `Conseil débutant le ${formatDate(board.startDate)}`,
      startDate: toDateOnly(board.startDate),
      startDateDisplay: formatDate(board.startDate),
      endDate: toDateOnly(board.endDate),
      endDateDisplay: formatHistoryDate(board.endDate),
      formattedMembers: formatBoardMembersForHistory(sortedMembers),
      status: board.status,
      members: sortedMembers.map((m) => {
        const isActive =
          board.status === "ACTIVE" &&
          !board.endDate &&
          (!m.endDate || m.endDate.getTime() >= today.getTime()) &&
          (!m.startDate || m.startDate.getTime() <= today.getTime());

        return {
          id: m.id,
          boardId: m.boardId,
          personName: m.personName,
          role: m.role,
          roleLabel: condoBoardRoleLabels[m.role],
          unitId: m.unitId ?? "",
          unitLabel: getUnitLabel(m.unit),
          startDate: toDateOnly(m.startDate),
          startDateDisplay: formatDate(m.startDate),
          endDate: toDateOnly(m.endDate),
          endDateDisplay: formatDate(m.endDate),
          status: isActive ? "Actif" : "Terminé",
          notes: m.notes ?? "",
        };
      }),
    };
  });
}

export async function getBoardsForCurrentCondo(
  user?: Pick<SessionUser, "role" | "condoId" | "organizationId"> | null,
  referenceDate = new Date()
): Promise<CurrentCondoBoards | null> {
  const condo = await getCurrentCondoForManager(user);
  if (!condo) return null;

  const [allBoards, units] = await Promise.all([
    getBoardsForCondo(condo.id, referenceDate),
    getBoardUnitOptionsForCondo(condo.id),
  ]);

  const activeBoard =
    allBoards.find((board) => !isBoardEnded(board)) ?? null;
  const historicalBoards = allBoards.filter(isBoardEnded);

  return { condo, activeBoard, historicalBoards, units };
}

// ---- Mutations ----

export async function createBoard(condoId: string, input: BoardMutationInput) {
  const tenantId = await getCondoTenantId(condoId);
  const startDate = toLocalDate(input.startDate);

  return prisma.condoBoard.create({
    data: {
      tenantId,
      condoCorporationId: condoId,
      name: optionalText(input.name),
      startDate,
      endDate: optionalDate(input.endDate),
      status: "ACTIVE",
    },
  });
}

export async function endBoard({
  condoId,
  boardId,
  endDate,
  endMembersAtSameDate = true,
}: {
  condoId: string;
  boardId: string;
  endDate: string;
  endMembersAtSameDate?: boolean;
}) {
  await assertBoardBelongsToCondo(boardId, condoId);
  const parsedEndDate = toLocalDate(endDate);

  const result = await prisma.$transaction(async (tx) => {
    const board = await tx.condoBoard.update({
      where: { id: boardId },
      data: { endDate: parsedEndDate, status: "ENDED" },
    });

    if (endMembersAtSameDate) {
      await tx.condoBoardMembership.updateMany({
        where: { boardId, deletedAt: null, endDate: null },
        data: { endDate: parsedEndDate, status: "ENDED" },
      });
    }

    return board;
  });

  return result;
}

export async function createBoardMember(
  condoId: string,
  input: BoardMemberMutationInput
) {
  const tenantId = await getCondoTenantId(condoId);
  await assertBoardBelongsToCondo(input.boardId, condoId);

  if (input.unitId) {
    await assertUnitBelongsToCondo(input.unitId, condoId);
  }

  return prisma.condoBoardMembership.create({
    data: {
      boardId: input.boardId,
      tenantId,
      unitId: input.unitId ?? null,
      personName: input.personName.trim(),
      role: input.role,
      startDate: optionalDate(input.startDate),
      endDate: optionalDate(input.endDate),
      notes: optionalText(input.notes),
      status: "ACTIVE",
    },
  });
}

export async function updateBoardMember(
  membershipId: string,
  condoId: string,
  input: BoardMemberMutationInput
) {
  const membership = await prisma.condoBoardMembership.findFirst({
    where: { id: membershipId, deletedAt: null },
    select: { id: true, board: { select: { condoCorporationId: true } } },
  });

  if (!membership || membership.board.condoCorporationId !== condoId) {
    throw new Error("Ce membre du conseil est introuvable pour cette copropriété.");
  }

  if (input.unitId) {
    await assertUnitBelongsToCondo(input.unitId, condoId);
  }

  return prisma.condoBoardMembership.update({
    where: { id: membershipId },
    data: {
      unitId: input.unitId ?? null,
      personName: input.personName.trim(),
      role: input.role,
      startDate: optionalDate(input.startDate),
      endDate: optionalDate(input.endDate),
      notes: optionalText(input.notes),
    },
  });
}

export async function endBoardMember(
  membershipId: string,
  condoId: string,
  endDate: string
) {
  const membership = await prisma.condoBoardMembership.findFirst({
    where: { id: membershipId, deletedAt: null },
    select: { id: true, board: { select: { condoCorporationId: true } } },
  });

  if (!membership || membership.board.condoCorporationId !== condoId) {
    throw new Error("Ce membre du conseil est introuvable.");
  }

  return prisma.condoBoardMembership.update({
    where: { id: membershipId },
    data: { endDate: toLocalDate(endDate), status: "ENDED" },
  });
}

export async function deleteBoardMember(membershipId: string, condoId: string) {
  const membership = await prisma.condoBoardMembership.findFirst({
    where: { id: membershipId, deletedAt: null },
    select: { id: true, board: { select: { condoCorporationId: true } } },
  });

  if (!membership || membership.board.condoCorporationId !== condoId) {
    throw new Error("Ce membre du conseil est introuvable.");
  }

  return prisma.condoBoardMembership.update({
    where: { id: membershipId },
    data: { deletedAt: new Date() },
  });
}
