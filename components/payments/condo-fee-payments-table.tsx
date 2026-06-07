"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";

import { DeletePaymentDialog } from "@/components/payments/delete-payment-dialog";
import {
  PaymentStatusBadge,
  statusLabels,
} from "@/components/payments/payment-status-badge";
import { RecordMultiplePaymentsDialog } from "@/components/payments/record-multiple-payments-dialog";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { Button } from "@/components/ui/button";
import type {
  PaymentStatus,
  UnitCondoFeeSummary,
} from "@/lib/payments/payment-types";

const currencyFormatter = new Intl.NumberFormat("fr-CA", {
  currency: "CAD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace("CA", "").trim();
}

function formatDate(value: string | null) {
  if (!value) {
    return "Aucun";
  }

  const [year, month, day] = value.split("-").map(Number);

  return dateFormatter.format(new Date(year, month - 1, day));
}

function getMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("fr-CA", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

type CondoFeePaymentsTableProps = {
  summaries: UnitCondoFeeSummary[];
  fiscalYearOptions: string[];
  readOnly?: boolean;
};

export function CondoFeePaymentsTable({
  summaries,
  fiscalYearOptions,
  readOnly = false,
}: CondoFeePaymentsTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "ALL">("ALL");
  const [month, setMonth] = useState("ALL");
  const [fiscalYear, setFiscalYear] = useState(fiscalYearOptions[0] ?? "2024");

  // Périodes disponibles pour le filtre (basées sur les derniers paiements)
  const monthOptions = useMemo(() => {
    const months = new Set(
      summaries
        .map((summary) => summary.lastPayment?.paymentMonth)
        .filter((value): value is string => Boolean(value))
    );

    return [...months].sort().reverse();
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return summaries.filter((summary) => {
      const matchesQuery =
        !normalizedQuery ||
        summary.unitNumber.toLowerCase().includes(normalizedQuery) ||
        summary.ownerName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "ALL" || summary.status === status;
      const matchesMonth =
        month === "ALL" || summary.lastPayment?.paymentMonth?.startsWith(month);

      return matchesQuery && matchesStatus && matchesMonth;
    });
  }, [month, query, status, summaries]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Paiements par unité
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Filtrez les frais de condo par unité, copropriétaire, statut et
            période.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <RecordMultiplePaymentsDialog
            units={summaries}
            fiscalYearOptions={fiscalYearOptions}
            defaultFiscalYear={fiscalYear}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-5 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Recherche
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Unité ou copropriétaire"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Statut
          </span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as PaymentStatus | "ALL")
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            <option value="ALL">Tous</option>
            <option value="CURRENT">À jour</option>
            <option value="LATE">En retard</option>
            <option value="PARTIAL">Partiel</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Mois
          </span>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            <option value="ALL">Tous les mois</option>
            {monthOptions.map((option) => (
              <option key={option} value={option}>
                {getMonthLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Année financière
          </span>
          <select
            value={fiscalYear}
            onChange={(event) => setFiscalYear(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            {fiscalYearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-white">
            <tr className="border-b border-slate-200">
              {[
                "Unité",
                "Copropriétaire",
                "Frais mensuels",
                "Dernier paiement reçu",
                "Mois payé",
                "Total reçu année financière",
                "Solde à recevoir",
                "Statut",
                      "Actions",
              ].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-base font-semibold text-slate-500"
                >
                  Aucune unité enregistrée.
                </td>
              </tr>
            ) : filteredSummaries.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-base font-semibold text-slate-500"
                >
                  Aucune unité ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              filteredSummaries.map((summary) => (
                <tr
                  key={summary.unitId}
                  className="border-b border-slate-100 align-middle hover:bg-slate-50"
                >
                  <td className="px-4 py-4 text-base font-bold text-slate-950">
                    {summary.unitNumber}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {summary.ownerName}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {formatCurrency(summary.monthlyFee)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(summary.lastPaymentDate)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {summary.lastPayment?.paymentMonth
                      ? getMonthLabel(summary.lastPayment.paymentMonth)
                      : "Aucun"}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-950">
                    {formatCurrency(summary.fiscalYearTotalReceived)}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-950">
                    {formatCurrency(summary.balanceDue)}
                  </td>
                  <td className="px-4 py-4">
                    <PaymentStatusBadge status={summary.status} />
                  </td>
                  <td className="w-[320px] whitespace-nowrap px-4 py-4">
                    <div className="flex flex-nowrap items-center gap-2">
                      <RecordPaymentDialog
                        defaultUnitId={summary.unitId}
                        readOnly={readOnly}
                        triggerLabel="Ajouter"
                        units={summaries}
                      />
                      {summary.lastPayment ? (
                        <>
                          <RecordPaymentDialog
                            defaultUnitId={summary.unitId}
                            mode="edit"
                            payment={summary.lastPayment}
                            readOnly={readOnly}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 whitespace-nowrap rounded-xl border-slate-300 bg-white"
                                disabled={readOnly}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                                Modifier
                              </Button>
                            }
                            units={summaries}
                          />
                          <DeletePaymentDialog
                            paymentId={summary.lastPayment.id}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 whitespace-nowrap rounded-xl border-red-200 bg-white text-red-700 hover:bg-red-50"
                                disabled={readOnly}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Effacer
                              </Button>
                            }
                            unitNumber={summary.unitNumber}
                          />
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {filteredSummaries.length} unité
          {filteredSummaries.length > 1 ? "s" : ""} affichée
          {filteredSummaries.length > 1 ? "s" : ""}
        </span>
        <span className="font-semibold">
          Filtre année financière: {fiscalYear} · Statut:{" "}
          {status === "ALL" ? "Tous" : statusLabels[status]}
        </span>
      </div>
    </section>
  );
}
