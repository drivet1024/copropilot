import type { Prisma } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type {
  CondoInformationFormInput,
  CreateCondoFormInput,
} from "@/lib/validators/condo";

export type CurrentCondo = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  fiscalYearEndDate: string | null;
  parkingShareValue: number;
  managerName: string;
  organizationId: string;
  buildingCount: number;
  unitCount: number;
};

type CurrentCondoUser = Pick<
  SessionUser,
  "role" | "condoId" | "organizationId"
> &
  Partial<Pick<SessionUser, "id">>;

const CREATE_CONDO_ROLES = ["MASTER_USER", "CONDO_MANAGER"];

function toDateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function optionalTextValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalDateValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("La date de fin d’année financière est invalide.");
  }

  return date;
}

function decimalValue(value: string | undefined) {
  if (!value) {
    return "0";
  }

  const normalized = value.trim().replace(",", ".");

  return normalized || "0";
}

function fiscalYearEndDateValue(input: CreateCondoFormInput) {
  const fiscalYearEndDate = optionalDateValue(input.fiscalYearEndDate);

  if (fiscalYearEndDate) {
    return fiscalYearEndDate;
  }

  const fiscalYearStartDate = optionalDateValue(input.fiscalYearStartDate);

  if (!fiscalYearStartDate) {
    return null;
  }

  const calculatedEndDate = new Date(fiscalYearStartDate);
  calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + 1);
  calculatedEndDate.setDate(calculatedEndDate.getDate() - 1);

  return calculatedEndDate;
}

function addressValue(input: CreateCondoFormInput) {
  const cityLine = [
    optionalTextValue(input.city),
    optionalTextValue(input.province),
    optionalTextValue(input.postalCode),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    [
      optionalTextValue(input.address),
      cityLine || null,
    ]
      .filter(Boolean)
      .join(", ") || null
  );
}

async function getFreshCurrentCondoUser(
  user?: CurrentCondoUser | null
): Promise<CurrentCondoUser | null | undefined> {
  if (!user?.id) {
    return user;
  }

  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      condoId: true,
      organizationId: true,
      role: true,
    },
  });

  return freshUser ?? user;
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

  return { id: { in: [] } };
}

export async function getCurrentCondoForManager(
  user?: CurrentCondoUser | null
): Promise<CurrentCondo | null> {
  const currentUser = await getFreshCurrentCondoUser(user);
  const condo = await prisma.condo.findFirst({
    where: getCurrentCondoWhere(currentUser),
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      fiscalYearEndDate: true,
      parkingShareValue: true,
      organizationId: true,
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
    parkingShareValue: Number(condo.parkingShareValue ?? 0),
    managerName:
      manager?.name ?? manager?.email ?? condo.organization.name ?? "Non défini",
    organizationId: condo.organizationId,
    buildingCount,
    unitCount,
  };
}

export async function updateCondoInformation(
  condoId: string,
  input: CondoInformationFormInput
) {
  return prisma.condo.update({
    where: { id: condoId },
    data: {
      address: optionalTextValue(input.address),
      fiscalYearEndDate: optionalDateValue(input.fiscalYearEndDate),
      name: input.name.trim(),
      parkingShareValue: decimalValue(input.parkingShareValue),
    },
  });
}

export async function createCondoForUser(
  user: Pick<
    SessionUser,
    "id" | "role" | "organizationId" | "condoId" | "email" | "name"
  >,
  input: CreateCondoFormInput
) {
  const name = input.name.trim();

  return prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.findUnique({
      where: { id: user.id },
      select: {
        condoId: true,
        email: true,
        id: true,
        name: true,
        organizationId: true,
        role: true,
        status: true,
      },
    });

    if (!dbUser || dbUser.status !== "ACTIVE") {
      throw new Error("Utilisateur introuvable ou inactif.");
    }

    if (!CREATE_CONDO_ROLES.includes(dbUser.role)) {
      throw new Error("Droits insuffisants pour créer une copropriété.");
    }

    let organizationId = dbUser.organizationId;

    if (organizationId) {
      const organization = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
      });

      organizationId = organization?.id ?? null;
    }

    if (!organizationId && user.organizationId) {
      const organization = await tx.organization.findUnique({
        where: { id: user.organizationId },
        select: { id: true },
      });

      organizationId = organization?.id ?? null;
    }

    if (!organizationId) {
      const organization = await tx.organization.create({
        data: {
          name,
        },
        select: {
          id: true,
        },
      });

      organizationId = organization.id;
    }

    const condo = await tx.condo.create({
      data: {
        address: addressValue(input),
        fiscalYearEndDate: fiscalYearEndDateValue(input),
        name,
        parkingShareValue: decimalValue(input.parkingShareValue),
        organizationId,
      },
      select: {
        address: true,
        fiscalYearEndDate: true,
        id: true,
        name: true,
        organizationId: true,
      },
    });

    await tx.user.update({
      where: { id: dbUser.id },
      data: {
        condoId: dbUser.role === "CONDO_MANAGER" ? condo.id : dbUser.condoId,
        organizationId,
      },
    });

    return condo;
  });
}
