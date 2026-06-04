"use client";

import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createUnitAction,
  type UnitActionResult,
  updateUnitAction,
} from "@/app/(app)/condos/units/actions";
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
import type { BuildingOption, CondoUnitRow } from "@/lib/data/units";

type UnitDialogProps = {
  buildings: BuildingOption[];
  condoName: string;
  mode: "create" | "edit";
  trigger: ReactNode;
  unit?: CondoUnitRow;
};

const roomCountOptions = [
  "1 1/2",
  "2 1/2",
  "3 1/2",
  "4 1/2",
  "5 1/2",
  "autre",
];

const fieldClassName =
  "h-12 rounded-xl border-slate-300 px-4 text-base text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100";

const selectClassName =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

function getFieldError(result: UnitActionResult | null, fieldName: string) {
  return result?.fieldErrors?.[fieldName]?.[0] ?? null;
}

function FieldError({
  fieldName,
  result,
}: {
  fieldName: string;
  result: UnitActionResult | null;
}) {
  const message = getFieldError(result, fieldName);

  return message ? (
    <span className="text-xs font-semibold text-red-600">{message}</span>
  ) : null;
}

function BuildingSelect({
  buildings,
  condoName,
  result,
  unit,
}: {
  buildings: BuildingOption[];
  condoName: string;
  result: UnitActionResult | null;
  unit?: CondoUnitRow;
}) {
  if (buildings.length === 0) {
    return (
      <>
        <input type="hidden" name="buildingId" value="" readOnly />
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Immeuble</span>
          <Input
            value="Créé automatiquement"
            readOnly
            className={`${fieldClassName} bg-slate-50 text-slate-500`}
          />
          <FieldError fieldName="buildingId" result={result} />
        </label>
      </>
    );
  }

  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">Immeuble</span>
      <select
        name="buildingId"
        defaultValue={unit?.buildingId ?? buildings[0]?.id ?? ""}
        required
        className={selectClassName}
      >
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name} — {condoName}
          </option>
        ))}
      </select>
      <FieldError fieldName="buildingId" result={result} />
    </label>
  );
}

function PreservedHiddenFields({ unit }: { unit?: CondoUnitRow }) {
  return (
    <>
      <input
        type="hidden"
        name="occupancyStatus"
        value={unit?.occupancyStatus ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="sharePercentage"
        value={unit?.sharePercentage ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="parkingSpace"
        value={unit?.parkingSpace ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="storageLocker"
        value={unit?.storageLocker ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="monthlyCondoFee"
        value={unit?.monthlyCondoFee ?? ""}
        readOnly
      />
      <input type="hidden" name="notes" value={unit?.notes ?? ""} readOnly />
    </>
  );
}

export function UnitDialog({
  buildings,
  condoName,
  mode,
  trigger,
  unit,
}: UnitDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<UnitActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";
  const selectedBuilding = buildings.find(
    (building) => building.id === unit?.buildingId
  );
  const subtitle = isEdit
    ? `Unité ${unit?.unitNumber ?? ""} · ${
        selectedBuilding?.name ?? unit?.buildingName ?? "Immeuble"
      } — ${condoName}`
    : `Nouvelle unité · ${condoName}`;

  function closeDialog() {
    if (!isPending) {
      setOpen(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const nextResult =
        isEdit && unit
          ? await updateUnitAction(unit.id, formData)
          : await createUnitAction(formData);

      setResult(nextResult);

      if (nextResult.ok) {
        form.reset();
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
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-5xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                {isEdit ? "Modification" : "Ajout"}
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                {isEdit ? "Modifier l’unité" : "Ajouter une unité"}
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                {subtitle}
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
          <PreservedHiddenFields unit={unit} />

          <div className="grid max-h-[calc(92vh-185px)] gap-x-4 gap-y-4 overflow-y-auto px-5 py-6 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Numéro d’unité
              </span>
              <Input
                name="unitNumber"
                defaultValue={unit?.unitNumber ?? ""}
                placeholder="101"
                required
                className={fieldClassName}
              />
              <FieldError fieldName="unitNumber" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Étage
              </span>
              <Input
                name="floor"
                defaultValue={unit?.floor ?? ""}
                placeholder="1"
                className={fieldClassName}
              />
              <FieldError fieldName="floor" result={result} />
            </label>

            <BuildingSelect
              buildings={buildings}
              condoName={condoName}
              result={result}
              unit={unit}
            />

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nom du propriétaire
              </span>
              <Input
                name="ownerName"
                defaultValue={unit?.ownerName ?? ""}
                placeholder="Marie Tremblay"
                className={fieldClassName}
              />
              <FieldError fieldName="ownerName" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Email
              </span>
              <Input
                name="ownerEmail"
                type="email"
                defaultValue={unit?.ownerEmail ?? ""}
                placeholder="proprietaire@example.com"
                className={fieldClassName}
              />
              <FieldError fieldName="ownerEmail" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Téléphone
              </span>
              <Input
                name="ownerPhone"
                type="tel"
                defaultValue={unit?.ownerPhone ?? ""}
                placeholder="514-555-0101"
                className={fieldClassName}
              />
              <FieldError fieldName="ownerPhone" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Cellulaire
              </span>
              <Input
                name="mobile"
                type="tel"
                defaultValue={unit?.mobile ?? ""}
                placeholder="514-555-0202"
                className={fieldClassName}
              />
              <FieldError fieldName="mobile" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Pieds carrés
              </span>
              <Input
                name="squareFeet"
                type="number"
                min="0"
                defaultValue={unit?.squareFeet ?? ""}
                placeholder="925"
                className={fieldClassName}
              />
              <FieldError fieldName="squareFeet" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nombre de pièces
              </span>
              <select
                name="roomCount"
                defaultValue={unit?.roomCount ?? ""}
                className={selectClassName}
              >
                <option value="">Non précisé</option>
                {roomCountOptions.map((roomCount) => (
                  <option key={roomCount} value={roomCount}>
                    {roomCount}
                  </option>
                ))}
              </select>
              <FieldError fieldName="roomCount" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Salles de bain
              </span>
              <Input
                name="bathroomCount"
                type="number"
                min="0"
                step="0.5"
                defaultValue={unit?.bathroomCount ?? ""}
                placeholder="1"
                className={fieldClassName}
              />
              <FieldError fieldName="bathroomCount" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de renouvellement d’assurance
              </span>
              <Input
                name="insuranceRenewalDate"
                type="date"
                defaultValue={unit?.insuranceRenewalDate ?? ""}
                className={fieldClassName}
              />
              <FieldError fieldName="insuranceRenewalDate" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date du chauffe-eau
              </span>
              <Input
                name="waterHeaterDate"
                type="date"
                defaultValue={unit?.waterHeaterDate ?? ""}
                className={fieldClassName}
              />
              <FieldError fieldName="waterHeaterDate" result={result} />
            </label>

            <div className="space-y-3">
              <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">
                <input
                  name="hasFireplace"
                  type="checkbox"
                  value="true"
                  defaultChecked={unit?.hasFireplace ?? false}
                  className="size-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Foyer
              </label>

              <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">
                <input
                  name="hasAirConditioning"
                  type="checkbox"
                  value="true"
                  defaultChecked={unit?.hasAirConditioning ?? false}
                  className="size-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Climatisation
              </label>
            </div>

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
              disabled={isPending}
            >
              {isEdit
                ? "Enregistrer les modifications"
                : "Ajouter l’unité"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
