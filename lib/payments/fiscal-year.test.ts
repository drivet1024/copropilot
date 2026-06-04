import { describe, expect, it } from "vitest";

import {
  calculateFiscalYearReceivedTotal,
  getFiscalYearRange,
  isDateInFiscalYear,
} from "./fiscal-year";

function dateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

describe("fiscal year helpers", () => {
  it("uses the calendar year when the fiscal year ends on December 31", () => {
    const range = getFiscalYearRange(
      new Date(2024, 11, 31),
      new Date(2024, 4, 1)
    );

    expect(dateOnly(range.start)).toBe("2024-01-01");
    expect(dateOnly(range.end)).toBe("2024-12-31");
  });

  it("defaults to December 31 when no fiscal year end date is configured", () => {
    const range = getFiscalYearRange(null, new Date(2024, 4, 1));

    expect(dateOnly(range.start)).toBe("2024-01-01");
    expect(dateOnly(range.end)).toBe("2024-12-31");
  });

  it("uses the prior July-to-June year before a June 30 fiscal end", () => {
    const range = getFiscalYearRange(
      new Date(2024, 5, 30),
      new Date(2024, 4, 1)
    );

    expect(dateOnly(range.start)).toBe("2023-07-01");
    expect(dateOnly(range.end)).toBe("2024-06-30");
  });

  it("uses the next June fiscal end after the fiscal year rolls over", () => {
    const range = getFiscalYearRange(
      new Date(2024, 5, 30),
      new Date(2024, 7, 1)
    );

    expect(dateOnly(range.start)).toBe("2024-07-01");
    expect(dateOnly(range.end)).toBe("2025-06-30");
  });

  it("filters payments to the active fiscal year", () => {
    const fiscalYearEndDate = new Date(2024, 5, 30);
    const referenceDate = new Date(2024, 4, 1);
    const payments = [
      { amount: 100, paymentDate: "2023-06-30" },
      { amount: 200, paymentDate: "2023-07-01" },
      { amount: 300, paymentDate: "2024-06-30" },
      { amount: 400, paymentDate: "2024-07-01" },
    ];

    expect(
      isDateInFiscalYear(new Date(2024, 5, 30), fiscalYearEndDate, referenceDate)
    ).toBe(true);
    expect(
      calculateFiscalYearReceivedTotal(
        payments,
        fiscalYearEndDate,
        referenceDate
      )
    ).toBe(500);
  });
});
