"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

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
import type { PaymentMethod, UnitCondoFeeSummary } from "@/lib/payments/payment-types";
import {
  createCondoFeePaymentsAction,
  type CondoFeePaymentActionResult,
} from "@/app/(app)/condos/payments/actions";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Virement bancaire",
  CASH: "Comptant",
  CHEQUE: "Chèque",
  OTHER: "Autre",
  PRE_AUTHORIZED: "Prélèvement",
};

const paymentMethods = Object.entries(paymentMethodLabels) as Array<[
  PaymentMethod,
  string
]>;

const fieldClassName =
  "h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500";

const selectClassName =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500";

const monthFormatter = new Intl.DateTimeFormat("fr-CA", {
  month: "long",
  year: "numeric",
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  })
    .format(value)
    .replace("CA", "")
    .trim();
}

function getUnitDueMonthLabel(unit: UnitCondoFeeSummary) {
  return unit.currentMonth.isPaid
    ? unit.nextPaymentMonth.label
    : unit.currentMonth.label;
}

type ReferencePeriod = {
  value: string; // "YYYY-MM"
  year: number;
  month: number;
  label: string;
};

function generateReferencePeriods(now: Date): ReferencePeriod[] {
  const periods: ReferencePeriod[] = [];
  for (let offset = -6; offset <= 6; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = `${year}-${String(month).padStart(2, "0")}`;
    periods.push({ value, year, month, label: monthFormatter.format(date) });
  }
  return periods;
}

function getDefaultPeriod(
  units: UnitCondoFeeSummary[],
  now: Date,
  periods: ReferencePeriod[]
): string {
  // Trouver le dernier paiement enregistré parmi toutes les unités
  const allPayments = units
    .map((u) => u.lastPayment)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (allPayments.length > 0) {
    // Trier par date de paiement décroissante pour trouver le plus récent
    allPayments.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
    const lastPayment = allPayments[0];

    // Lire le mois de référence ET l'année depuis paymentMonth ("YYYY-MM")
    const [lastYear, lastMonth] = lastPayment.paymentMonth.split("-").map(Number);

    // Mois suivant
    const nextMonth = lastMonth === 12 ? 1 : lastMonth + 1;
    const nextYear = lastMonth === 12 ? lastYear + 1 : lastYear;
    const nextValue = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

    // Vérifier si le mois suivant est dans la liste
    const found = periods.find((p) => p.value === nextValue);
    if (found) return found.value;
  }

  // Fallback : mois courant
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type RecordMultiplePaymentsDialogProps = {
  units: UnitCondoFeeSummary[];
  fiscalYearOptions: string[];
  defaultFiscalYear?: string;
  readOnly?: boolean;
};

type BatchUnit = {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  monthlyFee: number;
  dueMonthLabel: string;
  selected: boolean;
  note: string;
};

type PaymentFormState = {
  fiscalYear: string;
  referencePeriod: string; // "YYYY-MM"
  paymentDate: string;
  paymentMethod: PaymentMethod;
  chequeNumber: string;
  notes: string;
};

function buildUnitRows(units: UnitCondoFeeSummary[]): BatchUnit[] {
  return units.map((unit) => ({
    unitId: unit.unitId,
    unitNumber: unit.unitNumber,
    ownerName: unit.ownerName,
    monthlyFee: unit.monthlyFee,
    dueMonthLabel: getUnitDueMonthLabel(unit),
    selected: false,
    note: "",
  }));
}

export function RecordMultiplePaymentsDialog({
  units,
  fiscalYearOptions,
  defaultFiscalYear,
  readOnly = false,
}: RecordMultiplePaymentsDialogProps) {
  const router = useRouter();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const allPeriods = useMemo(() => generateReferencePeriods(now), []);
  const defaultPeriod = useMemo(
    () => getDefaultPeriod(units, now, allPeriods),
    [units, now, allPeriods]
  );
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CondoFeePaymentActionResult | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<BatchUnit[]>(() => buildUnitRows(units));
        const [formState, setFormState] = useState<PaymentFormState>({
    fiscalYear: defaultFiscalYear ?? fiscalYearOptions[0] ?? "",
    referencePeriod: defaultPeriod,
    paymentDate: today,
    paymentMethod: "BANK_TRANSFER",
    chequeNumber: "",
    notes: "",
  });

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return items.filter((item) => {
      if (!normalized) {
        return true;
      }

      return (
        item.unitNumber.toLowerCase().includes(normalized) ||
        item.ownerName.toLowerCase().includes(normalized)
      );
    });
  }, [items, search]);

  const selectedItems = items.filter((item) => item.selected);
  const selectedCount = selectedItems.length;
  const totalAmount = selectedItems.reduce(
    (total, item) => total + item.monthlyFee,
    0
  );

  const selectedPeriod = allPeriods.find(
    (p) => p.value === formState.referencePeriod
  );

  const isSubmitDisabled =
    isPending ||
    !formState.fiscalYear ||
    !formState.referencePeriod ||
    !formState.paymentDate ||
    !formState.paymentMethod ||
    (formState.paymentMethod === "CHEQUE" && !formState.chequeNumber.trim()) ||
    selectedCount === 0;

  function resetDialogState() {
    setResult(null);
    setSearch("");
    setItems(buildUnitRows(units));
    const freshDefaultPeriod = getDefaultPeriod(units, new Date(), allPeriods);
                setFormState({
      fiscalYear: defaultFiscalYear ?? fiscalYearOptions[0] ?? "",
      referencePeriod: freshDefaultPeriod,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "BANK_TRANSFER",
      chequeNumber: "",
      notes: "",
    });
  }

  function closeDialog() {
    if (!isPending) {
      setOpen(false);
    }
  }

  function updateItem(unitId: string, patch: Partial<BatchUnit>) {
    setItems((current) =>
      current.map((item) =>
        item.unitId === unitId ? { ...item, ...patch } : item
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      fiscalYear: formState.fiscalYear,
      month: formState.referencePeriod,
      referenceYear: selectedPeriod?.year ?? now.getFullYear(),
      paymentDate: formState.paymentDate,
      paymentMethod: formState.paymentMethod,
      chequeNumber: formState.chequeNumber,
      notes: formState.notes,
      payments: selectedItems.map((item) => ({
        unitId: item.unitId,
        amount: item.monthlyFee.toFixed(2),
        note: item.note,
      })),
    };

    startTransition(async () => {
      const nextResult = await createCondoFeePaymentsAction(payload);
      setResult(nextResult);

      if (nextResult.ok) {
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
        <Button
          type="button"
          disabled={readOnly}
          className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          + Ajouter plusieurs paiements
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-6xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                Paiements groupés
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                Ajouter plusieurs paiements
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                Enregistrez plusieurs paiements pour plusieurs unités en une seule opération.
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
          {/* Mois et année de référence */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <label className="space-y-2 sm:min-w-64">
                <span className="text-sm font-bold text-slate-700">
                  Mois et année de référence
                </span>
                <select
                  value={formState.referencePeriod}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      referencePeriod: event.target.value,
                    }))
                  }
                  className={selectClassName}
                >
                  {allPeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
                {!formState.referencePeriod ? (
                  <span className="text-xs font-semibold text-red-600">
                    Sélectionnez une période de référence.
                  </span>
                ) : null}
              </label>

              <label className="space-y-2 sm:min-w-48">
                <span className="text-sm font-bold text-slate-700">
                  Date du paiement
                </span>
                <input
                  type="date"
                  value={formState.paymentDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      paymentDate: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </label>

              <label className="space-y-2 sm:min-w-48">
                <span className="text-sm font-bold text-slate-700">
                  Méthode de paiement
                </span>
                <select
                  value={formState.paymentMethod}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      paymentMethod: event.target.value as PaymentMethod,
                    }))
                  }
                  className={selectClassName}
                >
                  {paymentMethods.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {formState.paymentMethod === "CHEQUE" ? (
                <label className="space-y-2 sm:min-w-40">
                  <span className="text-sm font-bold text-slate-700">
                    Numéro du chèque
                  </span>
                  <input
                    type="text"
                    value={formState.chequeNumber}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        chequeNumber: event.target.value,
                      }))
                    }
                    placeholder="Ex: 1001"
                    className={fieldClassName}
                  />
                </label>
              ) : null}
            </div>
          </div>

          <div className="border-b border-slate-200 px-5 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Liste des unités
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Sélectionnez les unités à inclure pour enregistrer leurs paiements mensuels.
                </p>
              </div>
              <div className="w-full max-w-sm">
                <label className="relative block">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Unité ou copropriétaire"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    {[
                      "Paiement reçu",
                      "Unité",
                      "Copropriétaire",
                      "Frais mensuels",
                      "Mois dû",
                      "Note",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.unitId}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() =>
                            updateItem(item.unitId, {
                              selected: !item.selected,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {item.unitNumber}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {item.ownerName}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {formatCurrency(item.monthlyFee)}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {item.dueMonthLabel}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          disabled={!item.selected}
                          value={item.note}
                          onChange={(event) =>
                            updateItem(item.unitId, { note: event.target.value })
                          }
                          className={fieldClassName}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-base font-semibold text-slate-500"
                      >
                        Aucune unité ne correspond à la recherche.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-sm text-slate-700">
              <p>
                <span className="font-semibold">{selectedCount}</span> unité
                {selectedCount > 1 ? "s" : ""} sélectionnée
                {selectedCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-950">
              Total à enregistrer : {formatCurrency(totalAmount)}
            </div>
          </div>

          {result && !result.ok ? (
            <div className="border-b border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {result.message}
            </div>
          ) : null}

          <DialogFooter className="mx-0 mb-0 flex flex-col-reverse gap-3 rounded-b-2xl border-t border-slate-200 bg-white px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
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
              disabled={isSubmitDisabled}
            >
              {isPending ? "Enregistrement..." : "Enregistrer les paiements"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
