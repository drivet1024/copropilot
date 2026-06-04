type PaymentForFiscalTotal = {
  amount: number;
  paymentDate: Date | string;
};

function toDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function resolveFiscalYearEndDate(
  fiscalYearEndDate: Date | null | undefined,
  referenceDate: Date
) {
  return fiscalYearEndDate ?? new Date(referenceDate.getFullYear(), 11, 31);
}

export function getFiscalYearRange(
  fiscalYearEndDate: Date | null | undefined,
  referenceDate: Date
) {
  const resolvedFiscalYearEndDate = resolveFiscalYearEndDate(
    fiscalYearEndDate,
    referenceDate
  );
  const endMonth = resolvedFiscalYearEndDate.getMonth();
  const endDay = resolvedFiscalYearEndDate.getDate();
  const referenceYear = referenceDate.getFullYear();
  const candidateEnd = new Date(referenceYear, endMonth, endDay, 23, 59, 59, 999);
  const endYear =
    referenceDate.getTime() > candidateEnd.getTime()
      ? referenceYear + 1
      : referenceYear;
  const end = new Date(endYear, endMonth, endDay, 23, 59, 59, 999);
  const start = new Date(endYear - 1, endMonth, endDay + 1, 0, 0, 0, 0);

  return { start, end };
}

export function isDateInFiscalYear(
  date: Date,
  fiscalYearEndDate: Date | null | undefined,
  referenceDate: Date
) {
  const { start, end } = getFiscalYearRange(fiscalYearEndDate, referenceDate);
  const timestamp = date.getTime();

  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

export function calculateFiscalYearReceivedTotal(
  payments: PaymentForFiscalTotal[],
  fiscalYearEndDate: Date | null | undefined,
  referenceDate: Date
) {
  return payments
    .filter((payment) =>
      isDateInFiscalYear(toDate(payment.paymentDate), fiscalYearEndDate, referenceDate)
    )
    .reduce((total, payment) => total + payment.amount, 0);
}
