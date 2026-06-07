export type PaymentMethod =
  | "CHEQUE"
  | "BANK_TRANSFER"
  | "PRE_AUTHORIZED"
  | "CASH"
  | "OTHER";

export type PaymentStatus = "CURRENT" | "LATE" | "PARTIAL";

export type CondoFeePayment = {
  id: string;
  tenantId: string;
  condoCorporationId: string;
  unitId: string;
  ownerName: string;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  referenceYear: number | null;
  paymentMethod: PaymentMethod;
  chequeNumber: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CondoFeePaymentHistory = {
  id: string;
  tenantId: string;
  condoCorporationId: string;
  unitId: string;
  periodStart: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  recordedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UnitCondoFeePaymentMonth = {
  amount: number;
  isCurrentMonth: boolean;
  isPaid: boolean;
  label: string;
  paidAt: string | null;
  periodStart: string;
};

export type UnitCondoFeeSummary = {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  monthlyFee: number;
  lastPayment: CondoFeePayment | null;
  lastPaymentDate: string | null;
  lastChequeReceivedDate: string | null;
  lastChequeNumber: string | null;
  currentMonth: UnitCondoFeePaymentMonth;
  nextPaymentMonth: UnitCondoFeePaymentMonth;
  historyMonths: UnitCondoFeePaymentMonth[];
  fiscalYearExpectedCount: number;
  fiscalYearPaidCount: number;
  fiscalYearTotalExpected: number;
  fiscalYearTotalReceived: number;
  balanceDue: number;
  status: PaymentStatus;
};
