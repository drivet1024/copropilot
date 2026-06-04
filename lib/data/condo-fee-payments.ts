import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  getFiscalYearRange,
  resolveFiscalYearEndDate,
} from "@/lib/payments/fiscal-year";
import { buildUnitPaymentSummaries } from "@/lib/payments/payment-summary";
import type {
  CondoFeePayment,
  PaymentMethod,
  UnitCondoFeeSummary,
} from "@/lib/payments/payment-types";
import { getCurrentCondoForManager, type CurrentCondo } from "./condos";

type GetPaymentSummariesInput = {
  condoId: string;
  fiscalYearEndDate: Date | null;
  referenceDate: Date;
};

export type CondoFeePaymentMutationInput = {
  amount: string;
  chequeNumber?: string;
  notes?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  unitId: string;
};

export type CondoFeePaymentSummaryResult = {
  paymentCount: number;
  summaries: UnitCondoFeeSummary[];
};

export type CurrentCondoPaymentSummaries = CondoFeePaymentSummaryResult & {
  condo: CurrentCondo;
  fiscalYearRange: {
    start: Date;
    end: Date;
  };
};

type UnitPaymentProfile = {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  monthlyFee: number;
};

function decimalToNumber(value: unknown) {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  return Number(value);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

async function getCondoTenantId(condoId: string) {
  const condo = await prisma.condo.findUnique({
    where: { id: condoId },
    select: {
      organizationId: true,
    },
  });

  if (!condo) {
    throw new Error("Aucune copropriété configurée.");
  }

  return condo.organizationId;
}

async function assertUnitBelongsToCondo(unitId: string, condoId: string) {
  const unit = await prisma.unit.findFirst({
    where: {
      deletedAt: null,
      id: unitId,
      building: {
        condoId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!unit) {
    throw new Error("L’unité sélectionnée n’appartient pas à cette copropriété.");
  }
}

export async function getUnitsAvailableForPayment(
  condoId: string
): Promise<UnitPaymentProfile[]> {
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
      monthlyCondoFee: true,
      number: true,
      ownerName: true,
    },
  });

  return units.map((unit) => ({
    monthlyFee: decimalToNumber(unit.monthlyCondoFee),
    ownerName: unit.ownerName ?? "Non défini",
    unitId: unit.id,
    unitNumber: unit.number,
  }));
}

export async function getCondoFeePaymentsForCondo(condoId: string) {
  const payments = await prisma.condoFeePayment.findMany({
    where: {
      condoCorporationId: condoId,
    },
    orderBy: [{ paymentDate: "asc" }, { createdAt: "asc" }],
    select: {
      amount: true,
      chequeNumber: true,
      condoCorporationId: true,
      createdAt: true,
      createdById: true,
      id: true,
      notes: true,
      paymentDate: true,
      paymentMethod: true,
      tenantId: true,
      unitId: true,
      updatedAt: true,
    },
  });

  return payments.map(
    (payment): CondoFeePayment => ({
      amount: decimalToNumber(payment.amount),
      chequeNumber: payment.chequeNumber,
      condoCorporationId: payment.condoCorporationId,
      createdAt: toDateOnly(payment.createdAt),
      createdById: payment.createdById,
      id: payment.id,
      notes: payment.notes,
      ownerName: "Non défini",
      paymentDate: toDateOnly(payment.paymentDate),
      paymentMethod: payment.paymentMethod,
      tenantId: payment.tenantId,
      unitId: payment.unitId,
      updatedAt: toDateOnly(payment.updatedAt),
    })
  );
}

export async function getCondoFeePaymentsForCurrentCondo(
  user?: Pick<SessionUser, "role" | "condoId" | "organizationId"> | null
) {
  // TODO: Replace temporary first condo lookup with session-based tenant and condo access control.
  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return null;
  }

  return {
    condo,
    payments: await getCondoFeePaymentsForCondo(condo.id),
  };
}

export async function getCondoFeePaymentSummaries({
  condoId,
  fiscalYearEndDate,
  referenceDate,
}: GetPaymentSummariesInput): Promise<CondoFeePaymentSummaryResult> {
  const [units, payments] = await Promise.all([
    getUnitsAvailableForPayment(condoId),
    getCondoFeePaymentsForCondo(condoId),
  ]);

  return {
    paymentCount: payments.length,
    summaries: buildUnitPaymentSummaries({
      condo: { fiscalYearEndDate },
      payments,
      referenceDate,
      units,
    }),
  };
}

export async function getCondoFeePaymentSummariesForCurrentCondo(
  user?: Pick<SessionUser, "role" | "condoId" | "organizationId"> | null,
  referenceDate = new Date()
): Promise<CurrentCondoPaymentSummaries | null> {
  // TODO: Replace temporary first condo lookup with session-based tenant and condo access control.
  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return null;
  }

  const fiscalYearEndDate = condo.fiscalYearEndDate
    ? toLocalDate(condo.fiscalYearEndDate)
    : null;
  const resolvedFiscalYearEndDate = resolveFiscalYearEndDate(
    fiscalYearEndDate,
    referenceDate
  );
  const fiscalYearRange = getFiscalYearRange(
    resolvedFiscalYearEndDate,
    referenceDate
  );
  const { paymentCount, summaries } = await getCondoFeePaymentSummaries({
    condoId: condo.id,
    fiscalYearEndDate,
    referenceDate,
  });

  return {
    condo,
    fiscalYearRange,
    paymentCount,
    summaries,
  };
}

export async function createCondoFeePayment(
  condoId: string,
  input: CondoFeePaymentMutationInput,
  createdById: string | null
) {
  await assertUnitBelongsToCondo(input.unitId, condoId);
  const tenantId = await getCondoTenantId(condoId);

  return prisma.condoFeePayment.create({
    data: {
      amount: input.amount,
      chequeNumber:
        input.paymentMethod === "CHEQUE"
          ? normalizeOptionalText(input.chequeNumber)
          : null,
      condoCorporationId: condoId,
      createdById,
      notes: normalizeOptionalText(input.notes),
      paymentDate: toLocalDate(input.paymentDate),
      paymentMethod: input.paymentMethod,
      tenantId,
      unitId: input.unitId,
    },
  });
}

export async function updateCondoFeePayment(
  paymentId: string,
  condoId: string,
  input: CondoFeePaymentMutationInput
) {
  await assertUnitBelongsToCondo(input.unitId, condoId);

  const payment = await prisma.condoFeePayment.findFirst({
    where: {
      condoCorporationId: condoId,
      id: paymentId,
    },
    select: {
      id: true,
    },
  });

  if (!payment) {
    throw new Error("Paiement introuvable pour cette copropriété.");
  }

  return prisma.condoFeePayment.update({
    where: {
      id: paymentId,
    },
    data: {
      amount: input.amount,
      chequeNumber:
        input.paymentMethod === "CHEQUE"
          ? normalizeOptionalText(input.chequeNumber)
          : null,
      notes: normalizeOptionalText(input.notes),
      paymentDate: toLocalDate(input.paymentDate),
      paymentMethod: input.paymentMethod,
      unitId: input.unitId,
    },
  });
}

export async function deleteCondoFeePayment(
  paymentId: string,
  condoId: string
) {
  const payment = await prisma.condoFeePayment.findFirst({
    where: {
      condoCorporationId: condoId,
      id: paymentId,
    },
    select: {
      id: true,
    },
  });

  if (!payment) {
    throw new Error("Paiement introuvable pour cette copropriété.");
  }

  return prisma.condoFeePayment.delete({
    where: {
      id: paymentId,
    },
  });
}
