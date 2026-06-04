import type { Prisma } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type CurrentCondo = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  fiscalYearEndDate: string | null;
  managerName: string;
  buildingCount: number;
  unitCount: number;
};

type CurrentCondoUser = Pick<
  SessionUser,
  "role" | "condoId" | "organizationId"
>;

function toDateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function getCurrentCondoWhere(
  user?: CurrentCondoUser | null
): Prisma.CondoWhereInput | undefined {
  if (!user || user.role === "MASTER_USER") {
    return undefined;
  }

  if (user.condoId) {
    return { id: user.condoId };
  }

  if (user.organizationId) {
    // TODO: Replace organization fallback with full session tenant selection.
    return { organizationId: user.organizationId };
  }

  // TODO: Replace first condo lookup with session tenant/condo access control.
  return undefined;
}

export async function getCurrentCondoForManager(
  user?: CurrentCondoUser | null
): Promise<CurrentCondo | null> {
  const condo = await prisma.condo.findFirst({
    where: getCurrentCondoWhere(user),
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      fiscalYearEndDate: true,
      organization: {
        select: {
          name: true,
        },
      },
      users: {
        where: {
          role: "CONDO_MANAGER",
        },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!condo) {
    return null;
  }

  const [buildingCount, unitCount] = await Promise.all([
    prisma.building.count({
      where: {
        condoId: condo.id,
      },
    }),
    prisma.unit.count({
      where: {
        deletedAt: null,
        building: {
          condoId: condo.id,
        },
      },
    }),
  ]);

  const manager = condo.users[0];

  return {
    id: condo.id,
    name: condo.name,
    address: condo.address ?? "",
    // TODO: Add city/province/postalCode columns to Condo when address fields are split.
    city: "",
    province: "",
    postalCode: "",
    fiscalYearEndDate: toDateInputValue(condo.fiscalYearEndDate),
    managerName:
      manager?.name ?? manager?.email ?? condo.organization.name ?? "Non défini",
    buildingCount,
    unitCount,
  };
}
