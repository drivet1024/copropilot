"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import {
  createCondoAction,
  type CreateCondoActionResult,
} from "@/app/(app)/condos/actions";
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
import { Input } from "@/components/ui/input";

export const CONDO_CREATED_MESSAGE_STORAGE_KEY =
  "copropilot:condo-created-message";

const fieldClassName =
  "h-12 rounded-xl border-slate-300 px-4 text-base text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100";

function getFieldError(result: CreateCondoActionResult | null, fieldName: string) {
  return result?.fieldErrors?.[fieldName]?.[0] ?? null;
}

function FieldError({
  fieldName,
  result,
}: {
  fieldName: string;
  result: CreateCondoActionResult | null;
}) {
  const message = getFieldError(result, fieldName);

  return message ? (
    <span className="text-xs font-semibold text-red-600">{message}</span>
  ) : null;
}

function calculateFiscalYearEndDate(startDate: string) {
  if (!startDate) {
    return "";
  }

  const [year, month, day] = startDate.split("-").map(Number);
  const endDate = new Date(year, month - 1, day);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setDate(endDate.getDate() - 1);

  return endDate.toISOString().slice(0, 10);
}

export function CreateCondoDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CreateCondoActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fiscalYearStartDate, setFiscalYearStartDate] = useState("");
  const [fiscalYearEndDate, setFiscalYearEndDate] = useState("");
  const [isFiscalYearEndDateAutomatic, setIsFiscalYearEndDateAutomatic] =
    useState(false);

  function closeDialog() {
    if (!isPending) {
      setOpen(false);
    }
  }

  function resetFormState() {
    setResult(null);
    setFiscalYearStartDate("");
    setFiscalYearEndDate("");
    setIsFiscalYearEndDateAutomatic(false);
  }

  function handleFiscalYearStartDateChange(value: string) {
    setFiscalYearStartDate(value);

    if (!fiscalYearEndDate || isFiscalYearEndDateAutomatic) {
      const calculatedEndDate = calculateFiscalYearEndDate(value);
      setFiscalYearEndDate(calculatedEndDate);
      setIsFiscalYearEndDateAutomatic(Boolean(calculatedEndDate));
    }
  }

  function handleFiscalYearEndDateChange(value: string) {
    setFiscalYearEndDate(value);
    setIsFiscalYearEndDateAutomatic(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const nextResult = await createCondoAction(formData);
      setResult(nextResult);

      if (nextResult.ok) {
        window.sessionStorage.setItem(
          CONDO_CREATED_MESSAGE_STORAGE_KEY,
          nextResult.message
        );
        form.reset();
        resetFormState();
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
          resetFormState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="mt-6 h-11 rounded-xl bg-teal-600 px-5 text-white hover:bg-teal-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Créer une copropriété
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-4xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                Copropriété
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                Créer une copropriété
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                Saisissez les renseignements de base pour repartir à zéro.
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
          <div className="grid max-h-[calc(92vh-185px)] gap-x-4 gap-y-4 overflow-y-auto px-5 py-6 md:grid-cols-2 sm:px-6">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Nom de la copropriété
              </span>
              <Input
                name="name"
                placeholder="Copropriété Test"
                disabled={isPending}
                aria-invalid={Boolean(getFieldError(result, "name"))}
                className={fieldClassName}
              />
              <FieldError fieldName="name" result={result} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Adresse
              </span>
              <Input
                name="address"
                placeholder="123 rue Principale"
                disabled={isPending}
                className={fieldClassName}
              />
              <FieldError fieldName="address" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Ville</span>
              <Input
                name="city"
                placeholder="Montréal"
                disabled={isPending}
                className={fieldClassName}
              />
              <FieldError fieldName="city" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Province
              </span>
              <Input
                name="province"
                placeholder="QC"
                disabled={isPending}
                className={fieldClassName}
              />
              <FieldError fieldName="province" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Code postal
              </span>
              <Input
                name="postalCode"
                placeholder="H2X 1Y4"
                disabled={isPending}
                className={fieldClassName}
              />
              <FieldError fieldName="postalCode" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de début d’année financière
              </span>
              <Input
                name="fiscalYearStartDate"
                type="date"
                value={fiscalYearStartDate}
                disabled={isPending}
                onChange={(event) =>
                  handleFiscalYearStartDateChange(event.target.value)
                }
                className={fieldClassName}
              />
              <FieldError fieldName="fiscalYearStartDate" result={result} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de fin d’année financière
              </span>
              <Input
                name="fiscalYearEndDate"
                type="date"
                value={fiscalYearEndDate}
                disabled={isPending}
                onChange={(event) =>
                  handleFiscalYearEndDateChange(event.target.value)
                }
                className={fieldClassName}
              />
              <FieldError fieldName="fiscalYearEndDate" result={result} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Quote-part par stationnement
              </span>
              <Input
                name="parkingShareValue"
                type="number"
                min="0"
                step="0.000001"
                defaultValue="0"
                disabled={isPending}
                className={fieldClassName}
              />
              <FieldError fieldName="parkingShareValue" result={result} />
            </label>

            {result && !result.ok ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
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
              disabled={isPending}
            >
              {isPending ? "Création..." : "Créer la copropriété"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
