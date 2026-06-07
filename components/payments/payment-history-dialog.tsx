"use client";

import type { ReactNode } from "react";
import { CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MonthlyPaymentCheckbox } from "@/components/payments/monthly-payment-checkbox";
import type { UnitCondoFeeSummary } from "@/lib/payments/payment-types";

const currencyFormatter = new Intl.NumberFormat("fr-CA", {
  currency: "CAD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace("CA", "").trim();
}

type PaymentHistoryDialogProps = {
  readOnly?: boolean;
  summary: UnitCondoFeeSummary;
  trigger: ReactNode;
};

export function PaymentHistoryDialog({
  readOnly = false,
  summary,
  trigger,
}: PaymentHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-4xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                Historique
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                Modifier les paiements - Unité {summary.unitNumber}
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                {summary.ownerName}
              </DialogDescription>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              {formatCurrency(summary.monthlyFee)} / mois
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(92vh-190px)] overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid gap-3 md:grid-cols-2">
            {summary.historyMonths.map((month) => (
              <div
                key={month.periodStart}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <CalendarCheck className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold capitalize text-slate-950">
                      {month.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-500">
                      {formatCurrency(month.amount)}
                    </p>
                  </div>
                </div>
                <MonthlyPaymentCheckbox
                  key={`${summary.unitId}-${month.periodStart}-${month.isPaid}`}
                  checked={month.isPaid}
                  label="Payé"
                  periodStart={month.periodStart}
                  readOnly={readOnly}
                  unitId={summary.unitId}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white px-5 text-base font-bold text-slate-700"
            >
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
