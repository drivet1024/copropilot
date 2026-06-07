"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import {
  createCondoFeePaymentAction,
  type CondoFeePaymentActionResult,
  updateCondoFeePaymentAction,
} from "@/app/(app)/condos/payments/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type {
  CondoFeePayment,
  PaymentMethod,
  UnitCondoFeeSummary,
} from "@/lib/payments/payment-types";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Virement bancaire",
  CASH: "Comptant",
  CHEQUE: "Chèque",
  OTHER: "Autre",
  PRE_AUTHORIZED: "Paiement préautorisé",
};

const paymentMethods = Object.entries(paymentMethodLabels) as Array<
  [PaymentMethod, string]
>;

const fieldClassName =
  "h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500";

const selectClassName =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500";

type RecordPaymentDialogProps = {
  defaultUnitId?: string;
  mode?: "create" | "edit";
  payment?: CondoFeePayment;
  readOnly?: boolean;
  trigger?: ReactNode;
  triggerLabel?: string;
  units: UnitCondoFeeSummary[];
};

function getFieldError(
  result: CondoFeePaymentActionResult | null,
  fieldName: string
) {
  return result?.fieldErrors?.[fieldName]?.[0] ?? null;
}

function FieldError({
  fieldName,
  result,
}: {
  fieldName: string;
  result: CondoFeePaymentActionResult | null;
}) {
  const message = getFieldError(result, fieldName);

  return message ? (
    <span className="text-xs font-semibold text-red-600">{message}</span>
  ) : null;
}

export function RecordPaymentDialog({
  defaultUnitId,
  mode = "create",
  payment,
  readOnly = false,
  trigger,
  triggerLabel = "Enregistrer un paiement",
  units,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = mode === "edit";
  const initialPaymentMethod = payment?.paymentMethod ?? "CHEQUE";
  const initialUnitId = payment?.unitId ?? defaultUnitId ?? units[0]?.unitId ?? "";
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(initialPaymentMethod);
  const [result, setResult] = useState<CondoFeePaymentActionResult | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
  const [isPending, startTransition] = useTransition();
  const selectedUnit = useMemo(
    () => units.find((unit) => unit.unitId === selectedUnitId) ?? units[0],
    [selectedUnitId, units]
  );
  const hasUnits = units.length > 0;
  const lockUnitSelect = Boolean(defaultUnitId) || isEdit;
  const title = isEdit ? "Modifier le paiement" : "Enregistrer un paiement";

  function closeDialog() {
    if (!isPending) {
      setOpen(false);
    }
  }

  function resetDialogState() {
    setResult(null);
    setSelectedUnitId(payment?.unitId ?? defaultUnitId ?? units[0]?.unitId ?? "");
    setPaymentMethod(payment?.paymentMethod ?? "CHEQUE");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const nextResult =
        isEdit && payment
          ? await updateCondoFeePaymentAction(payment.id, formData)
          : await createCondoFeePaymentAction(formData);

      setResult(nextResult);

      if (nextResult.ok) {
        form.reset();
        resetDialogState();
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
        }

        if (nextOpen) {
          resetDialogState();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            disabled={readOnly}
            className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-5xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                {isEdit ? "Modification" : "Paiement"}
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                {title}
                {selectedUnit ? ` - Unité ${selectedUnit.unitNumber}` : ""}
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                {isEdit
                  ? "Mettez à jour les informations du paiement sélectionné."
                  : "Saisissez un paiement reçu pour une unité de la copropriété."}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"
              disabled={isPending}
              onClick={closeDialog}
            >
              Annuler
            </Button>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <div className="grid max-h-[calc(92vh-185px)] gap-x-4 gap-y-4 overflow-y-auto px-5 py-6 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Unité
              </span>
              <select
                name="unitId"
                required
                value={selectedUnitId}
                disabled={!hasUnits || lockUnitSelect}
                onChange={(event) => setSelectedUnitId(event.target.value)}
                className={selectClassName}
              >
                {hasUnits ? (
                  units.map((unit) => (
                    <option key={unit.unitId} value={unit.unitId}>
                      Unité {unit.unitNumber} - {unit.ownerName}
                    </option>
                  ))
                ) : (
                  <option value="">Aucune unité enregistrée</option>
                )}
              </select>
              {lockUnitSelect ? (
                <input
                  type="hidden"
                  name="unitId"
                  value={selectedUnitId}
                  readOnly
                />
              ) : null}
              <FieldError fieldName="unitId" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Montant du paiement
              </span>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={payment?.amount ?? ""}
                className={fieldClassName}
              />
              <FieldError fieldName="amount" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date du paiement
              </span>
              <input
                name="paymentDate"
                type="date"
                required
                defaultValue={payment?.paymentDate ?? today}
                className={fieldClassName}
              />
              <FieldError fieldName="paymentDate" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Mois de référence
              </span>
              <input
                name="paymentMonth"
                type="month"
                required
                defaultValue={payment?.paymentMonth ?? today.slice(0, 7)}
                className={fieldClassName}
              />
              <FieldError fieldName="paymentMonth" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Méthode de paiement
              </span>
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
                className={selectClassName}
              >
                {paymentMethods.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldError fieldName="paymentMethod" result={result} />
            </label>

            {paymentMethod === "CHEQUE" ? (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Numéro du chèque
                </span>
                <input
                  name="chequeNumber"
                  type="text"
                  required
                  defaultValue={payment?.chequeNumber ?? ""}
                  className={fieldClassName}
                />
                <FieldError fieldName="chequeNumber" result={result} />
              </label>
            ) : null}

            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-semibold text-slate-700">
                Notes
              </span>
              <Textarea
                name="notes"
                rows={4}
                defaultValue={payment?.notes ?? ""}
                className="rounded-xl border-slate-300 px-4 py-3 text-base text-slate-950 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100"
              />
              <FieldError fieldName="notes" result={result} />
            </label>

            {result && !result.ok ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2 xl:col-span-3">
                {result.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white px-5 text-base font-bold text-slate-700"
              disabled={isPending}
              onClick={closeDialog}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm hover:bg-teal-700"
              disabled={isPending || !hasUnits}
            >
              {isPending
                ? "Enregistrement..."
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Enregistrer le paiement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
