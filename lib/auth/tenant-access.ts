import type { Prisma } from "@prisma/client";

import type { SessionUser } from "./session";

export type CondoScope =
  | { type: "all" }
  | { type: "condo"; condoId: string }
  | { type: "none" };

export class TenantAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantAccessError";
  }
}

export function isMasterUser(user: Pick<SessionUser, "role">) {
  return user.role === "MASTER_USER";
}

export function getUserCondoScope(
  user: Pick<SessionUser, "role" | "condoId">
): CondoScope {
  if (isMasterUser(user)) {
    return { type: "all" };
  }

  if (!user.condoId) {
    return { type: "none" };
  }

  return { type: "condo", condoId: user.condoId };
}

export function assertUserHasCondoScope(
  user: Pick<SessionUser, "role" | "condoId">
) {
  const scope = getUserCondoScope(user);

  if (scope.type === "none") {
    throw new TenantAccessError(
      "Un utilisateur non-master doit être associé à une copropriété."
    );
  }

  return scope;
}

export function assertCondoAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  condoId: string | null | undefined
) {
  if (!condoId) {
    throw new TenantAccessError("La copropriété est obligatoire.");
  }

  const scope = assertUserHasCondoScope(user);

  if (scope.type === "all") {
    return;
  }

  if (scope.condoId !== condoId) {
    throw new TenantAccessError(
      "Accès refusé: cette donnée appartient à une autre copropriété."
    );
  }
}

export function requireWritableCondoId(
  user: Pick<SessionUser, "role" | "condoId">,
  condoId: string | null | undefined
) {
  assertCondoAccess(user, condoId);
  return condoId as string;
}

export function getCondoWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.CondoWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { id: { in: [] } };
  }

  return { id: scope.condoId };
}

export function getBuildingWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.BuildingWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { condoId: { in: [] } };
  }

  return { condoId: scope.condoId };
}

export function getUnitWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.UnitWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { building: { condoId: { in: [] } } };
  }

  return { building: { condoId: scope.condoId } };
}

export function getDocumentWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.DocumentWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { condoId: { in: [] } };
  }

  return { condoId: scope.condoId };
}

export function getMaintenanceWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.MaintenanceTaskWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { condoId: { in: [] } };
  }

  return { condoId: scope.condoId };
}

export function getMaintenanceItemWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.MaintenanceItemWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { condoId: { in: [] } };
  }

  return { condoId: scope.condoId };
}

export function getMaintenanceOccurrenceWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.MaintenanceOccurrenceWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { condoId: { in: [] } };
  }

  return { condoId: scope.condoId };
}

export function getVendorWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.VendorWhereInput | undefined {
  const scope = getUserCondoScope(user);

  if (scope.type === "all") {
    return undefined;
  }

  if (scope.type === "none") {
    return { condoId: { in: [] } };
  }

  return { condoId: scope.condoId };
}

export function getInsuranceReminderLogWhereForUser(
  user: Pick<SessionUser, "role" | "condoId">
): Prisma.InsuranceReminderLogWhereInput | undefined {
  const unitWhere = getUnitWhereForUser(user);

  return unitWhere ? { unit: unitWhere } : undefined;
}

export async function requireCondoAccess(
  condoId: string,
  user?: SessionUser
) {
  const currentUser = user;

  if (currentUser) {
    assertCondoAccess(currentUser, condoId);
    return currentUser;
  }

  const { requireUser } = await import("./session");
  const sessionUser = await requireUser();

  assertCondoAccess(sessionUser, condoId);

  return sessionUser;
}

export async function assertBuildingAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  buildingId: string
) {
  const { prisma } = await import("../db/prisma");
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { condoId: true },
  });

  if (!building) {
    throw new TenantAccessError("Immeuble introuvable.");
  }

  assertCondoAccess(user, building.condoId);

  return building;
}

export async function assertUnitAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  unitId: string
) {
  const { prisma } = await import("../db/prisma");
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      building: {
        select: {
          condoId: true,
        },
      },
    },
  });

  if (!unit) {
    throw new TenantAccessError("Unité introuvable.");
  }

  assertCondoAccess(user, unit.building.condoId);

  return unit;
}

export async function assertDocumentAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  documentId: string
) {
  const { prisma } = await import("../db/prisma");
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { condoId: true },
  });

  if (!document) {
    throw new TenantAccessError("Document introuvable.");
  }

  assertCondoAccess(user, document.condoId);

  return document;
}

export async function assertMaintenanceAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  maintenanceId: string
) {
  const { prisma } = await import("../db/prisma");
  const maintenance = await prisma.maintenanceTask.findUnique({
    where: { id: maintenanceId },
    select: { condoId: true },
  });

  if (!maintenance) {
    throw new TenantAccessError("Tâche d’entretien introuvable.");
  }

  assertCondoAccess(user, maintenance.condoId);

  return maintenance;
}

export async function assertMaintenanceOccurrenceAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  occurrenceId: string
) {
  const { prisma } = await import("../db/prisma");
  const occurrence = await prisma.maintenanceOccurrence.findUnique({
    where: { id: occurrenceId },
    select: { condoId: true },
  });

  if (!occurrence) {
    throw new TenantAccessError("Occurrence d’entretien introuvable.");
  }

  assertCondoAccess(user, occurrence.condoId);

  return occurrence;
}

export async function assertVendorAccess(
  user: Pick<SessionUser, "role" | "condoId">,
  vendorId: string
) {
  const { prisma } = await import("../db/prisma");
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { condoId: true },
  });

  if (!vendor) {
    throw new TenantAccessError("Fournisseur introuvable.");
  }

  assertCondoAccess(user, vendor.condoId);

  return vendor;
}
