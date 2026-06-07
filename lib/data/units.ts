import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateUnitQuotePartTotal } from "@/lib/units/quote-part";
import { getCurrentCondoForManager, type CurrentCondo } from "./condos";

export type UnitOccupancyStatus =
  | "OWNER_OCCUPIED"
  | "NON_OWNER_OCCUPIED"
  | "RENTED"
  | "VACANT";

export type CondoUnitStatus =
  | "Propriétaire occupant"
  | "Non occupant"
  | "Loué"
  | "Vacant";

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
  quotePartOther: string;
  quotePartOtherDisplay: string;
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
  monthlyCondoFeeDisplay: string;
  activeAnnualCondoFeeAmount: number | null;
  activeAnnualCondoFeeDisplay: string;
  condoFees: UnitCondoFeeRow[];
  occupancyStatus: UnitOccupancyStatus | null;
  status: CondoUnitStatus | "Non défini";
  notes: string;
};

export type UnitCondoFeeRow = {
  id: string;
  annualAmount: string;
  annualAmountNumber: number;
  createdAt: string;
  monthlyAmountNumber: number;
  updatedAt: string;
  year: number;
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
  quotePartOther?: string;
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

const currencyFormatter = new Intl.NumberFormat("fr-CA", {
  currency: "CAD",
  style: "currency",
});

const occupancyStatusLabels: Record<UnitOccupancyStatus, CondoUnitStatus> = {
  OWNER_OCCUPIED: "Propriétaire occupant",
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

function formatDecimalPercentInput(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "";
  }

  const percentValue = value * 100;

  return Number.isInteger(percentValue)
    ? String(percentValue)
    : percentValue.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function dateToInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function dateTimeToDisplayValue(value: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatPercentageNumber(value: number, asPercent = false) {
  if (!Number.isFinite(value) || value < 0) {
    return "0,0000 %";
  }

  const normalizedValue = asPercent ? value * 100 : value;
  const asString = new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 4,
  }).format(normalizedValue);

  return `${asString} %`;
}

function getStatusLabel(status: UnitOccupancyStatus | null) {
  return status ? occupancyStatusLabels[status] : NOT_DEFINED;
}

function getActiveCondoFeeYear(referenceDate = new Date()) {
  return referenceDate.getFullYear();
}

function formatCurrency(value: number | null) {
  return value == null ? "Budget non défini" : currencyFormatter.format(value);
}

function getMonthlyCondoFeeDisplay({
  annualCondoFeeAmount,
}: {
  annualCondoFeeAmount: number | null;
}) {
  if (annualCondoFeeAmount == null || annualCondoFeeAmount <= 0) {
    return {
      amount: null,
      display: "Budget non défini",
    };
  }

  const amount = annualCondoFeeAmount / 12;

  return {
    amount,
    display: `${currencyFormatter.format(amount)} / mois`,
  };
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
  parkingShareValue = 0,
  activeCondoFeeYear = getActiveCondoFeeYear()
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
      quotePartOther: true,
      parkingCount: true,
      parkingSpace: true,
      storageLocker: true,
      monthlyCondoFee: true,
      condoFees: {
        orderBy: {
          year: "desc",
        },
        select: {
          annualAmount: true,
          createdAt: true,
          id: true,
          updatedAt: true,
          year: true,
        },
      },
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
    const activeCondoFee = unit.condoFees.find(
      (fee) => fee.year === activeCondoFeeYear
    );
    const annualCondoFeeAmount =
      activeCondoFee == null ? null : Number(activeCondoFee.annualAmount);
    const quotePart = calculateUnitQuotePartTotal({
      parkingCount: unit.parkingCount,
      parkingShareValue,
      quotePartOther: unit.quotePartOther,
      sharePercentage: unit.sharePercentage,
    });
    const monthlyCondoFee = getMonthlyCondoFeeDisplay({
      annualCondoFeeAmount,
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
      sharePercentage: formatDecimalPercentInput(quotePart.unitQuotePart),
      sharePercentageDisplay: formatPercentageNumber(quotePart.unitQuotePart, true),
      quotePartOther: formatDecimalPercentInput(quotePart.otherQuotePart),
      quotePartOtherDisplay: formatPercentageNumber(quotePart.otherQuotePart, true),
      parkingQuotePart: String(quotePart.parkingQuotePart),
      parkingQuotePartDisplay: formatPercentageNumber(quotePart.parkingQuotePart, true),
      parkingCount: quotePart.parkingCount,
      parkingCountDisplay: String(quotePart.parkingCount),
      totalQuotePart: String(quotePart.totalQuotePart),
      totalQuotePartDisplay: formatPercentageNumber(quotePart.totalQuotePart, true),
      parkingSpace: unit.parkingSpace ?? "",
      storageLocker: unit.storageLocker ?? "",
      parking: unit.parkingSpace ?? NOT_DEFINED,
      locker: unit.storageLocker ?? NOT_DEFINED,
      monthlyCondoFee: decimalToString(unit.monthlyCondoFee),
      monthlyCondoFeeAmount: monthlyCondoFee.amount,
      monthlyCondoFeeDisplay: monthlyCondoFee.display,
      activeAnnualCondoFeeAmount: annualCondoFeeAmount,
      activeAnnualCondoFeeDisplay: formatCurrency(annualCondoFeeAmount),
      condoFees: unit.condoFees.map((fee) => {
        const annualAmountNumber = Number(fee.annualAmount);

        return {
          id: fee.id,
          annualAmount: decimalToString(fee.annualAmount),
          annualAmountNumber,
          createdAt: dateTimeToDisplayValue(fee.createdAt),
          monthlyAmountNumber: annualAmountNumber / 12,
          updatedAt: dateTimeToDisplayValue(fee.updatedAt),
          year: fee.year,
        };
      }),
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

  const activeCondoFeeYear = getActiveCondoFeeYear();
  const buildings = await getBuildingsForCondo(condo.id);
  const units = await getUnitsForCondo(
    condo.id,
    condo.parkingShareValue,
    activeCondoFeeYear
  );

  return { condo, buildings, units };
}

export async function getUnitById(unitId: string, condoId: string) {
  const units = await getUnitsForCondo(condoId);

  return units.find((unit) => unit.id === unitId) ?? null;
}

export async function getUnitCondoFees(unitId: string, condoId: string) {
  await assertUnitBelongsToCondo(unitId, condoId);

  const fees = await prisma.unitCondoFee.findMany({
    where: {
      unitId,
    },
    orderBy: {
      year: "desc",
    },
    select: {
      annualAmount: true,
      createdAt: true,
      id: true,
      updatedAt: true,
      year: true,
    },
  });

  return fees.map((fee) => {
    const annualAmountNumber = Number(fee.annualAmount);

    return {
      id: fee.id,
      annualAmount: decimalToString(fee.annualAmount),
      annualAmountNumber,
      createdAt: dateTimeToDisplayValue(fee.createdAt),
      monthlyAmountNumber: annualAmountNumber / 12,
      updatedAt: dateTimeToDisplayValue(fee.updatedAt),
      year: fee.year,
    };
  });
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
      quotePartOther: optionalValue(input.quotePartOther) ?? "0",
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
      quotePartOther: optionalValue(input.quotePartOther) ?? "0",
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

export async function createUnitCondoFee(
  unitId: string,
  condoId: string,
  input: { annualAmount: string; year: number }
) {
  await assertUnitBelongsToCondo(unitId, condoId);

  return prisma.unitCondoFee.upsert({
    where: {
      unitId_year: {
        unitId,
        year: input.year,
      },
    },
    create: {
      annualAmount: input.annualAmount,
      unitId,
      year: input.year,
    },
    update: {
      annualAmount: input.annualAmount,
    },
  });
}

export async function updateUnitCondoFee(
  feeId: string,
  condoId: string,
  input: { annualAmount: string }
) {
  await assertUnitCondoFeeBelongsToCondo(feeId, condoId);

  return prisma.unitCondoFee.update({
    where: { id: feeId },
    data: {
      annualAmount: input.annualAmount,
    },
  });
}

export async function deleteUnitCondoFee(feeId: string, condoId: string) {
  await assertUnitCondoFeeBelongsToCondo(feeId, condoId);

  return prisma.unitCondoFee.delete({
    where: { id: feeId },
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

async function assertUnitCondoFeeBelongsToCondo(feeId: string, condoId: string) {
  const fee = await prisma.unitCondoFee.findFirst({
    where: {
      id: feeId,
      unit: {
        deletedAt: null,
        building: {
          condoId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!fee) {
    throw new Error("Ces frais de condo sont introuvables pour la copropriété sélectionnée.");
  }
}
