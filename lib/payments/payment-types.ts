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
  paymentMethod: PaymentMethod;
  chequeNumber: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
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
  fiscalYearTotalReceived: number;
  balanceDue: number;
  status: PaymentStatus;
};
