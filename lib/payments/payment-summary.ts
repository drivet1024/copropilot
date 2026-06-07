import {
  getFiscalYearRange,
  isDateInFiscalYear,
  resolveFiscalYearEndDate,
} from "./fiscal-year";
import type {
  CondoFeePayment,
  CondoFeePaymentHistory,
  PaymentStatus,
  UnitCondoFeePaymentMonth,
  UnitCondoFeeSummary,
} from "./payment-types";

type UnitPaymentProfile = {
  annualFee: number;
  unitId: string;
  unitNumber: string;
  ownerName: string;
  monthlyFee: number;
};

type PaymentSummaryCondo = {
  fiscalYearEndDate: Date | null;
};

const monthFormatter = new Intl.DateTimeFormat("fr-CA", {
  month: "long",
  year: "numeric",
});

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toMonth(value: string) {
  const [year, month] = value.split("-").map(Number);

  return new Date(year, month - 1, 1);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthKey(date: Date) {
  return toDateOnly(startOfMonth(date));
}

function isSameMonth(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  );
}

function getMonthsBetween(start: Date, end: Date) {
  const months: Date[] = [];
  let cursor = startOfMonth(start);
  const finalMonth = startOfMonth(end);

  while (cursor.getTime() <= finalMonth.getTime()) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return months;
}

function getLastTwelveMonths(referenceDate: Date) {
  const currentMonth = startOfMonth(referenceDate);

  return Array.from({ length: 12 }, (_, index) =>
    addMonths(currentMonth, -index)
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

  if (fiscalYearTotalReceived > 0) {
    return "PARTIAL";
  }

  return "LATE";
}

function comparePayments(a: CondoFeePayment, b: CondoFeePayment) {
  const paymentDateComparison = a.paymentDate.localeCompare(b.paymentDate);

  if (paymentDateComparison !== 0) {
    return paymentDateComparison;
  }

  return a.createdAt.localeCompare(b.createdAt);
}

function createMonthSummary({
  histories,
  month,
  monthlyFee,
  payments,
  referenceDate,
}: {
  histories: CondoFeePaymentHistory[];
  month: Date;
  monthlyFee: number;
  payments: CondoFeePayment[];
  referenceDate: Date;
}): UnitCondoFeePaymentMonth {
  const periodStart = getMonthKey(month);
  const monthPayments = payments.filter(
    (payment) => getMonthKey(toMonth(payment.paymentMonth)) === periodStart
  );
  const monthHistory = histories.find(
    (history) => history.periodStart === periodStart
  );
  const lastMonthPayment = [...monthPayments].sort(comparePayments).at(-1);

  return {
    amount: monthlyFee,
    isCurrentMonth: isSameMonth(month, referenceDate),
    isPaid: monthHistory?.isPaid ?? monthPayments.length > 0,
    label: monthFormatter.format(month),
    paidAt: monthHistory?.paidAt ?? lastMonthPayment?.paymentDate ?? null,
    periodStart,
  };
}

export function createUnitCondoFeeSummary({
  fiscalYearEndDate,
  histories = [],
  payments,
  referenceDate,
  unit,
}: {
  fiscalYearEndDate: Date | null;
  histories?: CondoFeePaymentHistory[];
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
      toMonth(payment.paymentMonth),
      resolvedFiscalYearEndDate,
      referenceDate
    )
  );
  const fiscalYearTotalReceived = fiscalYearPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );
  const fiscalMonths = getMonthsBetween(fiscalYearRange.start, referenceDate);
  const fiscalYearPaidCount = new Set(
    fiscalYearPayments.map((payment) =>
      getMonthKey(toMonth(payment.paymentMonth))
    )
  ).size;
  const fiscalYearExpectedCount = fiscalMonths.length;
  const fiscalYearTotalExpected = unit.annualFee;
  const balanceDue = fiscalYearTotalExpected - fiscalYearTotalReceived;
  const lastPayment = [...payments].sort(comparePayments).at(-1);
  const lastCheque = [...payments]
    .filter((payment) => payment.paymentMethod === "CHEQUE")
    .sort(comparePayments)
    .at(-1);
  const currentMonth = startOfMonth(referenceDate);
  const currentMonthSummary = createMonthSummary({
    histories,
    month: currentMonth,
    monthlyFee: unit.monthlyFee,
    payments,
    referenceDate,
  });
  const nextPaymentDate = currentMonthSummary.isPaid
    ? addMonths(currentMonth, 1)
    : currentMonth;

  return {
    unitId: unit.unitId,
    unitNumber: unit.unitNumber,
    ownerName: unit.ownerName,
    monthlyFee: unit.monthlyFee,
    lastPayment: lastPayment ?? null,
    lastPaymentDate: lastPayment?.paymentDate ?? null,
    lastChequeReceivedDate: lastCheque?.paymentDate ?? null,
    lastChequeNumber: lastCheque?.chequeNumber ?? null,
    currentMonth: currentMonthSummary,
    nextPaymentMonth: createMonthSummary({
      histories,
      month: nextPaymentDate,
      monthlyFee: unit.monthlyFee,
      payments,
      referenceDate,
    }),
    historyMonths: getLastTwelveMonths(referenceDate).map((month) =>
      createMonthSummary({
        histories,
        month,
        monthlyFee: unit.monthlyFee,
        payments,
        referenceDate,
      })
    ),
    fiscalYearExpectedCount,
    fiscalYearPaidCount,
    fiscalYearTotalExpected,
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
  histories = [],
  payments,
  referenceDate,
  units,
}: {
  fiscalYearEndDate: Date | null;
  histories?: CondoFeePaymentHistory[];
  payments: CondoFeePayment[];
  referenceDate: Date;
  units: UnitPaymentProfile[];
}) {
  return units.map((unit) =>
    createUnitCondoFeeSummary({
      fiscalYearEndDate,
      histories: histories.filter((history) => history.unitId === unit.unitId),
      payments: payments.filter((payment) => payment.unitId === unit.unitId),
      referenceDate,
      unit,
    })
  );
}

export function buildUnitPaymentSummaries({
  condo,
  histories = [],
  payments,
  referenceDate,
  units,
}: {
  condo: PaymentSummaryCondo;
  histories?: CondoFeePaymentHistory[];
  payments: CondoFeePayment[];
  referenceDate: Date;
  units: UnitPaymentProfile[];
}) {
  return createUnitCondoFeeSummaries({
    fiscalYearEndDate: condo.fiscalYearEndDate,
    histories,
    payments,
    referenceDate,
    units,
  });
}

export function getCondoFeePeriodStart(value: string) {
  return getMonthKey(toDate(value));
}
