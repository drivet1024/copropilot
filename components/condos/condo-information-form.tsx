"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type CondoInformation = {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  fiscalYearEndDate: string | null;
  buildingCount: number;
  unitCount: number;
  managerName: string;
};

type CondoInformationFormProps = {
  condo: CondoInformation;
};

export function CondoInformationForm({ condo }: CondoInformationFormProps) {
  const [saved, setSaved] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Informations de la copropriété
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-500">
            Modifiez les renseignements principaux de la copropriété
            sélectionnée.
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          // TODO: Persist condo information with a server action and audit log.
          setSaved(true);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Nom de la copropriété
            </span>
            <input
              name="name"
              defaultValue={condo.name}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Adresse
            </span>
            <input
              name="address"
              defaultValue={condo.address}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Ville</span>
            <input
              name="city"
              defaultValue={condo.city}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Province
            </span>
            <input
              name="province"
              defaultValue={condo.province}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Code postal
            </span>
            <input
              name="postalCode"
              defaultValue={condo.postalCode}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Date de fin d’année fiscale
            </span>
            <input
              name="fiscalYearEndDate"
              type="date"
              defaultValue={condo.fiscalYearEndDate ?? ""}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Nombre d’immeubles
            </span>
            <input
              value={condo.buildingCount}
              readOnly
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Nombre d’unités
            </span>
            <input
              value={condo.unitCount}
              readOnly
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500"
            />
            <span className="block text-xs font-semibold text-slate-500">
              Calculé automatiquement selon les unités enregistrées.
            </span>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Gestionnaire
            </span>
            <input
              value={condo.managerName}
              readOnly
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500"
            />
          </label>
        </div>

        {saved ? (
          <p className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
            Modifications prêtes à être enregistrées lorsque l’intégration base
            de données sera complétée.
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-slate-300 bg-white px-5"
            onClick={() => setSaved(false)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="h-11 rounded-xl bg-teal-600 px-5 text-white hover:bg-teal-700"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </section>
  );
}
