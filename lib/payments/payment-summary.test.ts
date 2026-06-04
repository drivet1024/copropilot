import { describe, expect, it } from "vitest";

import { createUnitCondoFeeSummary } from "./payment-summary";
import type { CondoFeePayment } from "./payment-types";

const basePayment = {
  tenantId: "org_demo",
  condoCorporationId: "condo_1",
  unitId: "unit_1",
  ownerName: "Sophie Martin",
  paymentMethod: "CHEQUE",
  chequeNumber: null,
  notes: null,
  createdById: "user_1",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
} satisfies Omit<CondoFeePayment, "id" | "amount" | "paymentDate">;

describe("payment summary helpers", () => {
  it("uses all payment methods for fiscal-year totals and cheques only for cheque metadata", () => {
    const summary = createUnitCondoFeeSummary({
      fiscalYearEndDate: new Date(2024, 11, 31),
      referenceDate: new Date(2024, 4, 15),
      unit: {
        unitId: "unit_1",
        unitNumber: "101",
        ownerName: "Sophie Martin",
        monthlyFee: 100,
      },
      payments: [
        {
          ...basePayment,
          id: "payment_1",
          amount: 100,
          paymentDate: "2024-01-01",
          paymentMethod: "CHEQUE",
          chequeNumber: "101",
        },
        {
          ...basePayment,
          id: "payment_2",
          amount: 100,
          paymentDate: "2024-02-01",
          paymentMethod: "BANK_TRANSFER",
          chequeNumber: null,
        },
        {
          ...basePayment,
          id: "payment_3",
          amount: 100,
          paymentDate: "2024-03-01",
          paymentMethod: "CHEQUE",
          chequeNumber: "103",
        },
      ],
    });

    expect(summary.fiscalYearTotalReceived).toBe(300);
    expect(summary.lastPaymentDate).toBe("2024-03-01");
    expect(summary.lastChequeReceivedDate).toBe("2024-03-01");
    expect(summary.lastChequeNumber).toBe("103");
    expect(summary.balanceDue).toBe(200);
    expect(summary.status).toBe("PARTIAL");
  });
});
