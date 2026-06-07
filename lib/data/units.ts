import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateUnitQuotePartTotal } from "@/lib/units/quote-part";
import { getCurrentCondoForManager, type CurrentCondo } from "./condos";

export type UnitOccupancyStatus =
  | "OWNER_OCCUPIED"
  | "NON_OWNER_OCCUPIED"
  | "RENTED"
  | "VACANT";

export type CondoUnitStatus = "Occupant" | "Non occupant" | "Loué" | "Vacant";

export type BuildingOption = {
  id: string;
  name: string;
};

export type CondoUnitRow = {
  id: string;
  unitNumber: string;
  buildingId: string;
  buildingName: string;
  floor: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  mobile: string;
  squareFeet: number | null;
  roomCount: string;
  bathroomCount: number | null;
  insuranceRenewalDate: string;
  waterHeaterDate: string;
  hasFireplace: boolean;
  hasAirConditioning: boolean;
  phone: string;
  email: string;
  sharePercentage: string;
  sharePercentageDisplay: string;
  parkingQuotePart: string;
  parkingQuotePartDisplay: string;
  parkingCount: number;
  parkingCountDisplay: string;
  totalQuotePart: string;
  totalQuotePartDisplay: string;
  parkingSpace: string;
  storageLocker: string;
  parking: string;
  locker: string;
  monthlyCondoFee: string;
  monthlyCondoFeeAmount: number | null;
  occupancyStatus: UnitOccupancyStatus | null;
  status: CondoUnitStatus | "Non défini";
  notes: string;
};

export type UnitMutationInput = {
  unitNumber: string;
  buildingId?: string;
  floor?: string;
  mobile?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  squareFeet?: number;
  roomCount?: string;
  bathroomCount?: number;
  insuranceRenewalDate?: string;
  waterHeaterDate?: string;
  hasFireplace?: boolean;
  hasAirConditioning?: boolean;
  sharePercentage?: string;
  parkingCount?: number;
  parkingSpace?: string;
  storageLocker?: string;
  occupancyStatus?: UnitOccupancyStatus | null;
  monthlyCondoFee?: string;
  notes?: string;
};

export type CurrentCondoUnits = {
  condo: CurrentCondo;
  buildings: BuildingOption[];
  units: CondoUnitRow[];
};

const NOT_DEFINED = "Non défini";

const occupancyStatusLabels: Record<UnitOccupancyStatus, CondoUnitStatus> = {
  OWNER_OCCUPIED: "Occupant",
  NON_OWNER_OCCUPIED: "Non occupant",
  RENTED: "Loué",
  VACANT: "Vacant",
};

function optionalValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalDateValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("La date fournie est invalide.");
  }

  return date;
}

function decimalToString(value: unknown) {
  return value == null ? "" : String(value);
}

function decimalToNumber(value: unknown) {
  return value == null ? null : Number(value);
}

function dateToInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatPercentageNumber(value: number, asPercent = false) {
  if (!Number.isFinite(value) || value < 0) {
    return "0 %";
  }

  const normalizedValue = asPercent ? value * 100 : value;
  const asString =
    Number.isInteger(normalizedValue)
      ? String(normalizedValue)
      : normalizedValue.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");

  return `${asString.replace(".", ",")} %`;
}

function getStatusLabel(status: UnitOccupancyStatus | null) {
  return status ? occupancyStatusLabels[status] : NOT_DEFINED;
}

async function getCondoBuildings(condoId: string) {
  return prisma.building.findMany({
    where: {
      condoId,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}

async function createDefaultBuilding(condoId: string) {
  const condo = await prisma.condo.findUnique({
    where: { id: condoId },
    select: {
      address: true,
    },
  });

  // TODO: Replace automatic first building creation with explicit building setup.
  return prisma.building.create({
    data: {
      address: condo?.address ?? null,
      condoId,
      name: "Immeuble principal",
    },
    select: {
      id: true,
      name: true,
    },
  });
}

async function resolveBuildingIdForCondo(
  condoId: string,
  buildingId?: string
) {
  const buildings = await getCondoBuildings(condoId);

  if (buildingId) {
    const selectedBuilding = buildings.find(
      (building) => building.id === buildingId
    );

    if (!selectedBuilding) {
      throw new Error("Le bâtiment sélectionné n’appartient pas à cette copropriété.");
    }

    return selectedBuilding.id;
  }

  if (buildings.length === 0) {
    const defaultBuilding = await createDefaultBuilding(condoId);

    return defaultBuilding.id;
  }

  if (buildings.length === 1) {
    return buildings[0].id;
  }

  throw new Error("Sélectionnez un bâtiment pour cette unité.");
}

export async function getBuildingsForCondo(
  condoId: string
): Promise<BuildingOption[]> {
  return getCondoBuildings(condoId);
}

export async function getUnitsForCondo(
  condoId: string,
  parkingShareValue = 0
): Promise<CondoUnitRow[]> {
  const units = await prisma.unit.findMany({
    where: {
      deletedAt: null,
      building: {
        condoId,
      },
    },
    orderBy: [{ building: { name: "asc" } }, { number: "asc" }],
    select: {
      id: true,
      number: true,
      floor: true,
      ownerName: true,
      email: true,
      phone: true,
      mobile: true,
      squareFeet: true,
      roomCount: true,
      bathroomCount: true,
      insuranceRenewalDate: true,
      waterHeaterDate: true,
      hasFireplace: true,
      hasAirConditioning: true,
      sharePercentage: true,
      parkingCount: true,
      parkingSpace: true,
      storageLocker: true,
      monthlyCondoFee: true,
      status: true,
      notes: true,
      building: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return units.map((unit) => {
    const quotePart = calculateUnitQuotePartTotal({
      parkingCount: unit.parkingCount,
      parkingShareValue,
      sharePercentage: unit.sharePercentage,
    });

    return {
      id: unit.id,
      unitNumber: unit.number,
      buildingId: unit.building.id,
      buildingName: unit.building.name,
      floor: unit.floor ?? "",
      ownerName: unit.ownerName ?? "",
      ownerPhone: unit.phone ?? "",
      ownerEmail: unit.email ?? "",
      mobile: unit.mobile ?? "",
      squareFeet: unit.squareFeet,
      roomCount: unit.roomCount ?? "",
      bathroomCount: unit.bathroomCount,
      insuranceRenewalDate: dateToInputValue(unit.insuranceRenewalDate),
      waterHeaterDate: dateToInputValue(unit.waterHeaterDate),
      hasFireplace: unit.hasFireplace,
      hasAirConditioning: unit.hasAirConditioning,
      phone: unit.phone ?? NOT_DEFINED,
      email: unit.email ?? NOT_DEFINED,
      sharePercentage: decimalToString(unit.sharePercentage),
      sharePercentageDisplay: formatPercentageNumber(quotePart.unitQuotePart),
      parkingQuotePart: String(quotePart.parkingQuotePart),
      parkingQuotePartDisplay: formatPercentageNumber(quotePart.parkingQuotePart),
      parkingCount: quotePart.parkingCount,
      parkingCountDisplay: String(quotePart.parkingCount),
      totalQuotePart: String(quotePart.totalQuotePart),
      totalQuotePartDisplay: formatPercentageNumber(quotePart.totalQuotePart, true),
      parkingSpace: unit.parkingSpace ?? "",
      storageLocker: unit.storageLocker ?? "",
      parking: unit.parkingSpace ?? NOT_DEFINED,
      locker: unit.storageLocker ?? NOT_DEFINED,
      monthlyCondoFee: decimalToString(unit.monthlyCondoFee),
      monthlyCondoFeeAmount: decimalToNumber(unit.monthlyCondoFee),
      occupancyStatus: unit.status,
      status: getStatusLabel(unit.status),
      notes: unit.notes ?? "",
    };
  });
}

export async function getUnitsForCurrentCondo(
  user?: Pick<SessionUser, "role" | "condoId" | "organizationId"> | null
): Promise<CurrentCondoUnits | null> {
  // TODO: Replace temporary first condo lookup with session-based tenant and condo access control.
  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return null;
  }

  const [buildings, units] = await Promise.all([
    getBuildingsForCondo(condo.id),
    getUnitsForCondo(condo.id, condo.parkingShareValue),
  ]);

  return { condo, buildings, units };
}

export async function getUnitById(unitId: string, condoId: string) {
  const units = await getUnitsForCondo(condoId);

  return units.find((unit) => unit.id === unitId) ?? null;
}

export async function createUnit(condoId: string, input: UnitMutationInput) {
  const buildingId = await resolveBuildingIdForCondo(condoId, input.buildingId);

  return prisma.unit.create({
    data: {
      buildingId,
      bathroomCount: input.bathroomCount ?? null,
      email: optionalValue(input.ownerEmail),
      floor: optionalValue(input.floor),
      hasAirConditioning: input.hasAirConditioning ?? false,
      hasFireplace: input.hasFireplace ?? false,
      insuranceRenewalDate: optionalDateValue(input.insuranceRenewalDate),
      mobile: optionalValue(input.mobile),
      monthlyCondoFee: optionalValue(input.monthlyCondoFee),
      notes: optionalValue(input.notes),
      number: input.unitNumber.trim(),
      ownerName: optionalValue(input.ownerName),
      parkingCount: input.parkingCount ?? 0,
      parkingSpace: optionalValue(input.parkingSpace),
      phone: optionalValue(input.ownerPhone),
      roomCount: optionalValue(input.roomCount),
      sharePercentage: optionalValue(input.sharePercentage),
      squareFeet: input.squareFeet ?? null,
      status: input.occupancyStatus ?? null,
      storageLocker: optionalValue(input.storageLocker),
      waterHeaterDate: optionalDateValue(input.waterHeaterDate),
    },
  });
}

export async function updateUnit(
  unitId: string,
  condoId: string,
  input: UnitMutationInput
) {
  await assertUnitBelongsToCondo(unitId, condoId);
  const buildingId = await resolveBuildingIdForCondo(condoId, input.buildingId);

  return prisma.unit.update({
    where: { id: unitId },
    data: {
      buildingId,
      bathroomCount: input.bathroomCount ?? null,
      email: optionalValue(input.ownerEmail),
      floor: optionalValue(input.floor),
      hasAirConditioning: input.hasAirConditioning ?? false,
      hasFireplace: input.hasFireplace ?? false,
      insuranceRenewalDate: optionalDateValue(input.insuranceRenewalDate),
      mobile: optionalValue(input.mobile),
      monthlyCondoFee: optionalValue(input.monthlyCondoFee),
      notes: optionalValue(input.notes),
      number: input.unitNumber.trim(),
      ownerName: optionalValue(input.ownerName),
      parkingCount: input.parkingCount ?? 0,
      parkingSpace: optionalValue(input.parkingSpace),
      phone: optionalValue(input.ownerPhone),
      roomCount: optionalValue(input.roomCount),
      sharePercentage: optionalValue(input.sharePercentage),
      squareFeet: input.squareFeet ?? null,
      status: input.occupancyStatus ?? null,
      storageLocker: optionalValue(input.storageLocker),
      waterHeaterDate: optionalDateValue(input.waterHeaterDate),
    },
  });
}

export async function deleteUnit(unitId: string, condoId: string) {
  await assertUnitBelongsToCondo(unitId, condoId);

  return prisma.unit.update({
    where: { id: unitId },
    data: {
      deletedAt: new Date(),
    },
  });
}

async function assertUnitBelongsToCondo(unitId: string, condoId: string) {
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      building: {
        condoId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!unit) {
    throw new Error("Cette unité est introuvable pour la copropriété sélectionnée.");
  }
}
