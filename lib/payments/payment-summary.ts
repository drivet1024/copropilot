import {
  getFiscalYearRange,
  isDateInFiscalYear,
  resolveFiscalYearEndDate,
} from "./fiscal-year";
import type {
  CondoFeePayment,
  PaymentStatus,
  UnitCondoFeeSummary,
} from "./payment-types";

type UnitPaymentProfile = {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  monthlyFee: number;
};

type PaymentSummaryCondo = {
  fiscalYearEndDate: Date | null;
};

function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getElapsedFiscalMonths(start: Date, referenceDate: Date) {
  return (
    (referenceDate.getFullYear() - start.getFullYear()) * 12 +
    (referenceDate.getMonth() - start.getMonth()) +
    1
  );
}

function getPaymentStatus({
  balanceDue,
  fiscalYearTotalReceived,
}: {
  balanceDue: number;
  fiscalYearTotalReceived: number;
}): PaymentStatus {
  if (balanceDue <= 0) {
    return "CURRENT";
  }

  if (fiscalYearTotalReceived > 0 && balanceDue > 0) {
    return "PARTIAL";
  }

  return "LATE";
}

export function createUnitCondoFeeSummary({
  fiscalYearEndDate,
  payments,
  referenceDate,
  unit,
}: {
  fiscalYearEndDate: Date | null;
  payments: CondoFeePayment[];
  referenceDate: Date;
  unit: UnitPaymentProfile;
}): UnitCondoFeeSummary {
  const resolvedFiscalYearEndDate = resolveFiscalYearEndDate(
    fiscalYearEndDate,
    referenceDate
  );
  const fiscalYearRange = getFiscalYearRange(
    resolvedFiscalYearEndDate,
    referenceDate
  );
  const fiscalYearPayments = payments.filter((payment) =>
    isDateInFiscalYear(
      toDate(payment.paymentDate),
      resolvedFiscalYearEndDate,
      referenceDate
    )
  );
  const fiscalYearTotalReceived = fiscalYearPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );
  const lastPayment = [...payments].sort((a, b) =>
    a.paymentDate.localeCompare(b.paymentDate)
  ).at(-1);
  const lastCheque = [...payments]
    .filter((payment) => payment.paymentMethod === "CHEQUE")
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))
    .at(-1);
  const expectedTotal =
    unit.monthlyFee * getElapsedFiscalMonths(fiscalYearRange.start, referenceDate);
  const balanceDue = Math.max(0, expectedTotal - fiscalYearTotalReceived);

  return {
    unitId: unit.unitId,
    unitNumber: unit.unitNumber,
    ownerName: unit.ownerName,
    monthlyFee: unit.monthlyFee,
    lastPayment: lastPayment ?? null,
    lastPaymentDate: lastPayment?.paymentDate ?? null,
    lastChequeReceivedDate: lastCheque?.paymentDate ?? null,
    lastChequeNumber: lastCheque?.chequeNumber ?? null,
    fiscalYearTotalReceived,
    balanceDue,
    status: getPaymentStatus({
      balanceDue,
      fiscalYearTotalReceived,
    }),
  };
}

export function createUnitCondoFeeSummaries({
  fiscalYearEndDate,
  payments,
  referenceDate,
  units,
}: {
  fiscalYearEndDate: Date | null;
  payments: CondoFeePayment[];
  referenceDate: Date;
  units: UnitPaymentProfile[];
}) {
  return units.map((unit) =>
    createUnitCondoFeeSummary({
      fiscalYearEndDate,
      payments: payments.filter((payment) => payment.unitId === unit.unitId),
      referenceDate,
      unit,
    })
  );
}

export function buildUnitPaymentSummaries({
  condo,
  payments,
  referenceDate,
  units,
}: {
  condo: PaymentSummaryCondo;
  payments: CondoFeePayment[];
  referenceDate: Date;
  units: UnitPaymentProfile[];
}) {
  return createUnitCondoFeeSummaries({
    fiscalYearEndDate: condo.fiscalYearEndDate,
    payments,
    referenceDate,
    units,
  });
}
