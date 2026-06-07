"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { DeleteUnitDialog } from "@/components/condos/delete-unit-dialog";
import { UnitDialog } from "@/components/condos/unit-dialog";
import { Button } from "@/components/ui/button";
import type { BuildingOption, CondoUnitRow } from "@/lib/data/units";

type UnitStatusFilter = "Tous" | CondoUnitRow["status"];

type UnitsTableProps = {
  buildings: BuildingOption[];
  canManageUnits: boolean;
  condoName: string;
  showBuildingColumn: boolean;
  units: CondoUnitRow[];
};

const statusOptions: UnitStatusFilter[] = [
  "Tous",
  "Propriétaire occupant",
  "Non occupant",
  "Loué",
  "Vacant",
  "Non défini",
];

function createAddUnitButton() {
  return (
    <Button
      type="button"
      className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
    >
      <Plus className="size-4" aria-hidden="true" />
      Ajouter une unité
    </Button>
  );
}

export function UnitsTable({
  buildings,
  canManageUnits,
  condoName,
  showBuildingColumn,
  units,
}: UnitsTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<UnitStatusFilter>("Tous");

  const filteredUnits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return units.filter((unit) => {
      const matchesQuery =
        !normalizedQuery ||
        unit.unitNumber.toLowerCase().includes(normalizedQuery) ||
        unit.ownerName.toLowerCase().includes(normalizedQuery) ||
        unit.phone.toLowerCase().includes(normalizedQuery) ||
        unit.email.toLowerCase().includes(normalizedQuery) ||
        unit.mobile.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "Tous" || unit.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, status, units]);

  const headers = [
    "Unité",
    ...(showBuildingColumn ? ["Bâtiment"] : []),
    "Propriétaire",
    "Quote-part totale",
    "Frais mensuels",
    "Statut de location",
    "Actions",
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Unités</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Gérez les unités et les copropriétaires associés à cette
            copropriété.
          </p>
        </div>
        {canManageUnits ? (
          <UnitDialog
            buildings={buildings}
            condoName={condoName}
            mode="create"
            trigger={createAddUnitButton()}
          />
        ) : null}
      </div>

      {units.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <h3 className="text-2xl font-bold text-slate-950">
            Aucune unité enregistrée
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
            Ajoutez la première unité de cette copropriété.
          </p>
          {canManageUnits ? (
            <div className="mt-6 flex justify-center">
              <UnitDialog
                buildings={buildings}
                condoName={condoName}
                mode="create"
                trigger={createAddUnitButton()}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-5 md:grid-cols-[1fr_220px]">
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
                  placeholder="Unité, propriétaire, téléphone ou courriel"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Statut de location
              </span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as UnitStatusFilter)
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  {headers.map((header) => (
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
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="px-4 py-8 text-center text-base font-semibold text-slate-500"
                    >
                      Aucune unité ne correspond aux filtres.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr
                      key={unit.id}
                      className="border-b border-slate-100 align-middle hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-base font-bold text-slate-950">
                        {unit.unitNumber}
                      </td>
                      {showBuildingColumn ? (
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {unit.buildingName}
                        </td>
                      ) : null}
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {unit.ownerName || "Non défini"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {unit.totalQuotePartDisplay}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {unit.monthlyCondoFeeDisplay}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
                          {unit.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {canManageUnits ? (
                          <div className="flex flex-wrap gap-2">
                            <UnitDialog
                              buildings={buildings}
                              condoName={condoName}
                              mode="edit"
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-xl border-slate-300 bg-white"
                                >
                                  <Pencil
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Modifier
                                </Button>
                              }
                              unit={unit}
                            />
                            <DeleteUnitDialog
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-xl border-red-200 bg-white text-red-700 hover:bg-red-50"
                                >
                                  <Trash2
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Retirer
                                </Button>
                              }
                              unitId={unit.id}
                              unitNumber={unit.unitNumber}
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-slate-500">
                            Lecture seule
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 text-sm font-semibold text-slate-500">
            {filteredUnits.length} unité
            {filteredUnits.length > 1 ? "s" : ""} affichée
            {filteredUnits.length > 1 ? "s" : ""}
          </div>
        </>
      )}
    </section>
  );
}
