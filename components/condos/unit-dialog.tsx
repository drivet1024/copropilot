"use client";

import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createUnitAction,
  deleteUnitCondoFeeAction,
  saveUnitCondoFeeAction,
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
import type { UnitCondoFeeRow } from "@/lib/data/units";

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

const rentalStatusOptions = [
  ["", "Non défini"],
  ["OWNER_OCCUPIED", "Propriétaire occupant"],
  ["NON_OWNER_OCCUPIED", "Non occupant"],
  ["RENTED", "Loué"],
  ["VACANT", "Vacant"],
] as const;

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
        name="monthlyCondoFee"
        value={unit?.monthlyCondoFee ?? ""}
        readOnly
      />
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value);
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-700">
        {value}
      </div>
    </div>
  );
}

function UnitCondoFeesPanel({ unit }: { unit: CondoUnitRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingFee, setEditingFee] = useState<UnitCondoFeeRow | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [annualAmount, setAnnualAmount] = useState("");
  const [result, setResult] = useState<UnitActionResult | null>(null);

  function resetForm() {
    setEditingFee(null);
    setYear(String(new Date().getFullYear()));
    setAnnualAmount("");
  }

  function handleEdit(fee: UnitCondoFeeRow) {
    setEditingFee(fee);
    setYear(String(fee.year));
    setAnnualAmount(fee.annualAmount);
    setResult(null);
  }

  function handleSave() {
    const formData = new FormData();
    formData.set("unitId", unit.id);
    formData.set("year", year);
    formData.set("annualAmount", annualAmount);

    if (editingFee) {
      formData.set("feeId", editingFee.id);
    }

    startTransition(async () => {
      const nextResult = await saveUnitCondoFeeAction(formData);
      setResult(nextResult);

      if (nextResult.ok) {
        resetForm();
        router.refresh();
      }
    });
  }

  function handleDelete(fee: UnitCondoFeeRow) {
    const confirmed = window.confirm(
      `Supprimer les frais de condo de l’année ${fee.year} ?`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const nextResult = await deleteUnitCondoFeeAction(fee.id);
      setResult(nextResult);

      if (nextResult.ok) {
        if (editingFee?.id === fee.id) {
          resetForm();
        }
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-base font-bold text-slate-950">
          {editingFee ? "Modifier les frais annuels" : "Ajouter des frais annuels"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr_auto]">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Année</span>
            <Input
              type="number"
              min="1900"
              max={new Date().getFullYear() + 10}
              value={year}
              disabled={isPending || Boolean(editingFee)}
              onChange={(event) => setYear(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Montant annuel des frais de condo
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={annualAmount}
              disabled={isPending}
              onChange={(event) => setAnnualAmount(event.target.value)}
              placeholder="3600.00"
              className={fieldClassName}
            />
          </label>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              className="h-12 rounded-xl bg-teal-600 px-5 text-base font-bold text-white hover:bg-teal-700"
              disabled={isPending}
              onClick={handleSave}
            >
              {editingFee ? "Enregistrer" : "Ajouter"}
            </Button>
            {editingFee ? (
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"
                disabled={isPending}
                onClick={resetForm}
              >
                Annuler
              </Button>
            ) : null}
          </div>
        </div>
        {result ? (
          <p
            className={
              result.ok
                ? "mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
                : "mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            }
          >
            {result.message}
          </p>
        ) : null}
        {result?.fieldErrors ? (
          <div className="mt-3 space-y-1 text-sm font-semibold text-red-700">
            {Object.values(result.fieldErrors)
              .flat()
              .filter(Boolean)
              .map((message) => (
                <p key={message}>{message}</p>
              ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              {[
                "Année",
                "Montant annuel",
                "Montant mensuel",
                "Dernière modification",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unit.condoFees.length > 0 ? (
              unit.condoFees.map((fee) => (
                <tr key={fee.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-bold text-slate-950">
                    {fee.year}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {formatCurrency(fee.annualAmountNumber)}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {formatCurrency(fee.monthlyAmountNumber)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{fee.updatedAt}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
                        disabled={isPending}
                        onClick={() => handleEdit(fee)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-xl border-red-200 bg-white px-3 text-xs font-bold text-red-700"
                        disabled={isPending}
                        onClick={() => handleDelete(fee)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm font-semibold text-slate-500"
                >
                  Aucun frais annuel enregistré pour cette unité.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState<"general" | "fees">("general");
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
          setActiveTab("general");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-5xl"
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-6 sm:px-6">
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

        {isEdit ? (
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              {[
                ["general", "Général"],
                ["fees", "Frais de condo"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    activeTab === value
                      ? "rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  }
                  onClick={() => setActiveTab(value as "general" | "fees")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "fees" && isEdit && unit ? (
          <>
            <UnitCondoFeesPanel unit={unit} />
            <DialogFooter className="mx-0 mb-0 shrink-0 flex-col-reverse gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl border-slate-300 bg-white px-5 text-base font-bold text-slate-700"
                onClick={closeDialog}
              >
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <PreservedHiddenFields unit={unit} />

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/60 px-5 py-6 sm:px-6">
              <FormSection title="Informations générales">
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

                <BuildingSelect
                  buildings={buildings}
                  condoName={condoName}
                  result={result}
                  unit={unit}
                />

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Propriétaire
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
                    Statut de location
                  </span>
                  <select
                    name="occupancyStatus"
                    defaultValue={unit?.occupancyStatus ?? ""}
                    className={selectClassName}
                  >
                    {rentalStatusOptions.map(([value, label]) => (
                      <option key={value || "UNKNOWN"} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <FieldError fieldName="occupancyStatus" result={result} />
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
                    Courriel
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
              </FormSection>

              <FormSection
                title="Quote-part"
                description="Les valeurs calculées se mettent à jour dans la liste après sauvegarde."
              >
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Quote-part de base
                  </span>
                  <Input
                    name="sharePercentage"
                    type="number"
                    min="0"
                    step="0.000001"
                    defaultValue={unit?.sharePercentage ?? ""}
                    placeholder="0.043225"
                    className={fieldClassName}
                  />
                  <FieldError fieldName="sharePercentage" result={result} />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Quote-part autre
                  </span>
                  <Input
                    name="quotePartOther"
                    type="number"
                    min="0"
                    step="0.000001"
                    defaultValue={unit?.quotePartOther ?? ""}
                    placeholder="0.1500"
                    className={fieldClassName}
                  />
                  <FieldError fieldName="quotePartOther" result={result} />
                </label>

                <ReadOnlyField
                  label="Quote-part stationnement calculée"
                  value={unit?.parkingQuotePartDisplay ?? "0 %"}
                />
                <ReadOnlyField
                  label="Quote-part totale calculée"
                  value={unit?.totalQuotePartDisplay ?? "0 %"}
                />
              </FormSection>

              <FormSection
                title="Frais de condo"
                description="Le frais mensuel est calculé à partir du montant annuel de cette unité divisé par 12."
              >
                <ReadOnlyField
                  label="Montant annuel des frais de condo"
                  value={unit?.activeAnnualCondoFeeDisplay ?? "Budget non défini"}
                />
                <ReadOnlyField
                  label="Frais mensuels calculés"
                  value={unit?.monthlyCondoFeeDisplay ?? "Budget non défini"}
                />
              </FormSection>

              <FormSection title="Informations complémentaires">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Nombre de stationnements
                  </span>
                  <Input
                    name="parkingCount"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={String(unit?.parkingCount ?? 0)}
                    placeholder="0"
                    className={fieldClassName}
                  />
                  <FieldError fieldName="parkingCount" result={result} />
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
                    Stationnement détaillé
                  </span>
                  <Input
                    name="parkingSpace"
                    defaultValue={unit?.parkingSpace ?? ""}
                    placeholder="P1, P2"
                    className={fieldClassName}
                  />
                  <FieldError fieldName="parkingSpace" result={result} />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Casier
                  </span>
                  <Input
                    name="storageLocker"
                    defaultValue={unit?.storageLocker ?? ""}
                    placeholder="C-12"
                    className={fieldClassName}
                  />
                  <FieldError fieldName="storageLocker" result={result} />
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
                  <span className="text-sm font-semibold text-slate-700">
                    Équipements
                  </span>
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

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Notes
                  </span>
                  <textarea
                    name="notes"
                    defaultValue={unit?.notes ?? ""}
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                  <FieldError fieldName="notes" result={result} />
                </label>
              </FormSection>

              {result && !result.ok ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {result.message}
                </p>
              ) : null}
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0 flex-col-reverse gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
