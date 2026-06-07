type QuotePartCalculationInput = {
  parkingCount?: unknown;
  parkingShareValue?: unknown;
  sharePercentage?: unknown;
};

type QuotePartCalculationResult = {
  parkingCount: number;
  parkingShareValue: number;
  parkingQuotePart: number;
  totalQuotePart: number;
  unitQuotePart: number;
};

function toNonNegativeNumber(value: unknown) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(",", "."))
        : Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return numericValue;
}

function toNonNegativeInteger(value: unknown) {
  const numericValue = toNonNegativeNumber(value);

  return Math.floor(numericValue);
}

export function calculateUnitQuotePartTotal(
  input: QuotePartCalculationInput
): QuotePartCalculationResult {
  const unitQuotePart = toNonNegativeNumber(input.sharePercentage);
  const parkingCount = toNonNegativeInteger(input.parkingCount);
  const parkingShareValue = toNonNegativeNumber(input.parkingShareValue);
  const parkingQuotePart = parkingCount * parkingShareValue;
  const totalQuotePart = unitQuotePart + parkingQuotePart;

  return {
    parkingCount,
    parkingShareValue,
    parkingQuotePart,
    totalQuotePart,
    unitQuotePart,
  };
}
