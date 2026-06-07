import { createUnitCondoFeeSummaries } from "@/lib/payments/payment-summary";
import type {
  CondoFeePayment,
  UnitCondoFeeSummary,
} from "@/lib/payments/payment-types";

type UnitFeeProfile = {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  monthlyFee: number;
};

const unitFeeProfiles: UnitFeeProfile[] = [
  {
    unitId: "unit_101",
    unitNumber: "101",
    ownerName: "Sophie Martin",
    monthlyFee: 425,
  },
  {
    unitId: "unit_102",
    unitNumber: "102",
    ownerName: "Marc Tremblay",
    monthlyFee: 390,
  },
  {
    unitId: "unit_201",
    unitNumber: "201",
    ownerName: "Nadia Gagnon",
    monthlyFee: 510,
  },
];

function createPayment({
  amount,
  id,
  paymentDate,
  paymentMethod = "CHEQUE",
  unitId,
}: {
  amount: number;
  id: string;
  paymentDate: string;
  paymentMethod?: CondoFeePayment["paymentMethod"];
  unitId: string;
}): CondoFeePayment {
  return {
    amount,
    chequeNumber: paymentMethod === "CHEQUE" ? id.split("_").at(-1) ?? null : null,
    condoCorporationId: "condo_1",
    createdAt: paymentDate,
    createdById: "user_1",
    id,
    notes: null,
    ownerName: "Non défini",
    paymentDate,
    paymentMonth: paymentDate.slice(0, 7),
    referenceYear: Number(paymentDate.slice(0, 4)),
    paymentMethod,
    tenantId: "org_demo",
    unitId,
    updatedAt: paymentDate,
  };
}

export const condoFeePayments: CondoFeePayment[] = [
  createPayment({
    amount: 425,
    id: "payment_101_2024_01",
    paymentDate: "2024-01-01",
    unitId: "unit_101",
  }),
  createPayment({
    amount: 425,
    id: "payment_101_2024_02",
    paymentDate: "2024-02-01",
    unitId: "unit_101",
  }),
  createPayment({
    amount: 425,
    id: "payment_101_2024_03",
    paymentDate: "2024-03-01",
    unitId: "unit_101",
  }),
  createPayment({
    amount: 425,
    id: "payment_101_2024_04",
    paymentDate: "2024-04-01",
    unitId: "unit_101",
  }),
  createPayment({
    amount: 390,
    id: "payment_102_2024_01",
    paymentDate: "2024-01-01",
    unitId: "unit_102",
  }),
  createPayment({
    amount: 390,
    id: "payment_102_2024_02",
    paymentDate: "2024-02-01",
    unitId: "unit_102",
  }),
  createPayment({
    amount: 510,
    id: "payment_201_2024_01",
    paymentDate: "2024-01-01",
    unitId: "unit_201",
  }),
  createPayment({
    amount: 510,
    id: "payment_201_2024_02",
    paymentDate: "2024-02-01",
    unitId: "unit_201",
  }),
  createPayment({
    amount: 510,
    id: "payment_201_2024_03",
    paymentDate: "2024-03-01",
    unitId: "unit_201",
  }),
];

function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function getMockUnitCondoFeeSummaries({
  fiscalYearEndDate,
  referenceDate,
}: {
  fiscalYearEndDate: string;
  referenceDate: Date;
}): UnitCondoFeeSummary[] {
  const fiscalEnd = toDate(fiscalYearEndDate);

  return createUnitCondoFeeSummaries({
    fiscalYearEndDate: fiscalEnd,
    payments: condoFeePayments,
    referenceDate,
    units: unitFeeProfiles,
  });
}
