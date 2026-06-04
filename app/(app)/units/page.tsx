import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import {
  assertBuildingAccess,
  assertUnitAccess,
  getBuildingWhereForUser,
  getUnitWhereForUser,
} from "@/lib/auth/tenant-access";
import { requireRole, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const roomCountOptions = ["1 1/2", "2 1/2", "3 1/2", "4 1/2", "5 1/2", "autre"];

type UnitsSearchParams = Promise<{
  q?: string | string[];
  buildingId?: string | string[];
  edit?: string | string[];
  new?: string | string[];
}>;

type UnitListItem = {
  id: string;
  number: string;
  floor: string | null;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  squareFeet: number | null;
  insuranceRenewalDate: Date | null;
  building: {
    id: string;
    name: string;
    condo: {
      id: string;
      name: string;
    };
    units: Array<{ squareFeet: number | null }>;
  };
};

type UnitBuildingListItem = {
  id: string;
  name: string;
  condo: {
    id: string;
    name: string;
  };
  units: Array<{ id: string; squareFeet: number | null }>;
};

type SelectedUnitItem = UnitFormUnit & {
  id: string;
  number: string;
  buildingId: string;
  building: {
    name: string;
    condo: {
      name: string;
    };
  };
};

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  return getFormValue(formData, key) || null;
}

function getOptionalInt(formData: FormData, key: string) {
  const value = getFormValue(formData, key);

  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error("Les pieds carrés doivent être un nombre valide.");
  }

  return parsedValue;
}

function getOptionalFloat(formData: FormData, key: string) {
  const value = getFormValue(formData, key);

  if (!value) {
    return null;
  }

  const parsedValue = Number.parseFloat(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error("Le nombre de salles de bain doit être un nombre valide.");
  }

  return parsedValue;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getFormValue(formData, key);

  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("La date fournie est invalide.");
  }

  return parsedDate;
}

function getBooleanValue(formData: FormData, key: string) {
  return formData.get(key) === "true";
}

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "—";
}

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatOptional(value: string | number | null) {
  return value ?? "Non précisé";
}

function formatQuotePart(
  unitSquareFeet?: number | null,
  buildingUnits?: { squareFeet: number | null }[]
) {
  const total =
    buildingUnits?.reduce((sum, unit) => sum + (unit.squareFeet ?? 0), 0) ?? 0;

  if (!unitSquareFeet || total <= 0) {
    return "—";
  }

  return `${((unitSquareFeet / total) * 100).toFixed(2)} %`;
}

function getUnitData(formData: FormData) {
  const number = getFormValue(formData, "number");
  const buildingId = getFormValue(formData, "buildingId");

  if (!number || !buildingId) {
    throw new Error("Le numéro d’unité et l’immeuble sont obligatoires.");
  }

  return {
    number,
    floor: getOptionalString(formData, "floor"),
    buildingId,
    ownerName: getOptionalString(formData, "ownerName"),
    email: getOptionalString(formData, "email"),
    phone: getOptionalString(formData, "phone"),
    mobile: getOptionalString(formData, "mobile"),
    squareFeet: getOptionalInt(formData, "squareFeet"),
    roomCount: getOptionalString(formData, "roomCount"),
    bathroomCount: getOptionalFloat(formData, "bathroomCount"),
    hasFireplace: getBooleanValue(formData, "hasFireplace"),
    hasAirConditioning: getBooleanValue(formData, "hasAirConditioning"),
    insuranceRenewalDate: getOptionalDate(formData, "insuranceRenewalDate"),
    waterHeaterDate: getOptionalDate(formData, "waterHeaterDate"),
  };
}

type UnitFormBuilding = {
  id: string;
  name: string;
  condo: {
    name: string;
  };
};

type UnitFormUnit = {
  number?: string;
  floor?: string | null;
  buildingId?: string;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  squareFeet?: number | null;
  roomCount?: string | null;
  bathroomCount?: number | null;
  insuranceRenewalDate?: Date | null;
  waterHeaterDate?: Date | null;
  hasFireplace?: boolean;
  hasAirConditioning?: boolean;
};

function UnitFormFields({
  buildings,
  disabled = false,
  unit,
}: {
  buildings: UnitFormBuilding[];
  disabled?: boolean;
  unit?: UnitFormUnit;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Numéro d’unité
        </span>
        <input
          name="number"
          type="text"
          required
          defaultValue={unit?.number ?? ""}
          placeholder="101"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Étage</span>
        <input
          name="floor"
          type="text"
          defaultValue={unit?.floor ?? ""}
          placeholder="1"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Immeuble</span>
        <select
          name="buildingId"
          required
          defaultValue={unit?.buildingId ?? ""}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        >
          <option value="" disabled>
            Sélectionner un immeuble
          </option>
          {buildings.map((building: UnitFormBuilding) => (
            <option key={building.id} value={building.id}>
              {building.name} — {building.condo.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Nom du propriétaire
        </span>
        <input
          name="ownerName"
          type="text"
          defaultValue={unit?.ownerName ?? ""}
          placeholder="Marie Tremblay"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={unit?.email ?? ""}
          placeholder="proprietaire@example.com"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Téléphone</span>
        <input
          name="phone"
          type="tel"
          defaultValue={unit?.phone ?? ""}
          placeholder="514-555-0101"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Cellulaire</span>
        <input
          name="mobile"
          type="tel"
          defaultValue={unit?.mobile ?? ""}
          placeholder="514-555-0202"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Pieds carrés
        </span>
        <input
          name="squareFeet"
          type="number"
          min="0"
          defaultValue={unit?.squareFeet ?? ""}
          placeholder="925"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Nombre de pièces
        </span>
        <select
          name="roomCount"
          defaultValue={unit?.roomCount ?? ""}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        >
          <option value="">Non précisé</option>
          {roomCountOptions.map((roomCount: string) => (
            <option key={roomCount} value={roomCount}>
              {roomCount}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Salles de bain
        </span>
        <input
          name="bathroomCount"
          type="number"
          min="0"
          step="0.5"
          defaultValue={unit?.bathroomCount ?? ""}
          placeholder="1"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Date de renouvellement d’assurance
        </span>
        <input
          name="insuranceRenewalDate"
          type="date"
          defaultValue={formatDateInput(unit?.insuranceRenewalDate ?? null)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Date du chauffe-eau
        </span>
        <input
          name="waterHeaterDate"
          type="date"
          defaultValue={formatDateInput(unit?.waterHeaterDate ?? null)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
          disabled={disabled}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            name="hasFireplace"
            value="true"
            type="checkbox"
            defaultChecked={unit?.hasFireplace ?? false}
            className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:bg-slate-100"
            disabled={disabled}
          />
          Foyer
        </label>

        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            name="hasAirConditioning"
            value="true"
            type="checkbox"
            defaultChecked={unit?.hasAirConditioning ?? false}
            className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:bg-slate-100"
            disabled={disabled}
          />
          Climatisation
        </label>
      </div>
    </div>
  );
}

async function createUnit(formData: FormData) {
  "use server";

  const user = await requireRole(["MASTER_USER", "CONDO_MANAGER"]);
  const data = getUnitData(formData);

  await assertBuildingAccess(user, data.buildingId);

  await prisma.unit.create({
    data,
  });

  revalidatePath("/units");
  redirect("/units");
}

async function updateUnit(formData: FormData) {
  "use server";

  const user = await requireRole(["MASTER_USER", "CONDO_MANAGER"]);
  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de l’unité est obligatoire.");
  }

  const data = getUnitData(formData);

  await assertUnitAccess(user, id);
  await assertBuildingAccess(user, data.buildingId);

  await prisma.unit.update({
    where: { id },
    data,
  });

  revalidatePath("/units");
  redirect("/units");
}

async function deleteUnit(formData: FormData) {
  "use server";

  const user = await requireRole(["MASTER_USER", "CONDO_MANAGER"]);
  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de l’unité est obligatoire.");
  }

  await assertUnitAccess(user, id);

  await prisma.unit.delete({ where: { id } });

  revalidatePath("/units");
  redirect("/units");
}

export default async function UnitsPage({
  searchParams,
}: {
  searchParams?: UnitsSearchParams;
}) {
  const user = await requireUser();
  const canManageUnits =
    user.role === "MASTER_USER" || user.role === "CONDO_MANAGER";
  const tenantBuildingWhere = getBuildingWhereForUser(user);
  const tenantUnitWhere = getUnitWhereForUser(user);

  const params = searchParams ? await searchParams : {};
  const q = getSearchParam(params.q);
  const selectedBuildingId = getSearchParam(params.buildingId);
  const editUnitId = getSearchParam(params.edit);
  const isNewUnitModalOpen =
    canManageUnits && getSearchParam(params.new) === "1" && !editUnitId;
  const filters: Prisma.UnitWhereInput[] = [];

  if (tenantUnitWhere) {
    filters.push(tenantUnitWhere);
  }

  if (selectedBuildingId) {
    filters.push({ buildingId: selectedBuildingId });
  }

  if (q) {
    filters.push({
      OR: [
        { number: { contains: q, mode: "insensitive" as const } },
        { ownerName: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
        { mobile: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  const unitWhere: Prisma.UnitWhereInput | undefined =
    filters.length > 0 ? { AND: filters } : undefined;

  const [unitsRaw, buildingsRaw, selectedUnitRaw] = await Promise.all([
    prisma.unit.findMany({
      where: unitWhere,
      include: {
        building: {
          include: {
            condo: true,
            units: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.building.findMany({
      where: tenantBuildingWhere,
      include: {
        condo: true,
        units: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    canManageUnits && editUnitId
      ? prisma.unit.findFirst({
          where: {
            AND: [
              { id: editUnitId },
              ...(tenantUnitWhere ? [tenantUnitWhere] : []),
            ],
          },
          include: {
            building: {
              include: {
                condo: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const units = unitsRaw as UnitListItem[];
  const buildings = buildingsRaw as UnitBuildingListItem[];
  const selectedUnit = selectedUnitRaw as SelectedUnitItem | null;

  const linkedCondoCount = new Set(
    units.map((unit: UnitListItem) => unit.building.condo.id)
  ).size;

  const kpis = [
    { label: "Unités", value: units.length },
    { label: "Immeubles", value: buildings.length },
    { label: "Copropriétés liées", value: linkedCondoCount },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">Unités</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Gérez les unités privatives associées à vos immeubles.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi: { label: string; value: number }) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-base font-semibold text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-4 text-4xl font-bold text-slate-950">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Recherche et filtres
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Recherchez une unité par numéro, propriétaire, téléphone,
            cellulaire ou email.
          </p>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px_auto_auto]">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher une unité"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          />
          <select
            name="buildingId"
            defaultValue={selectedBuildingId}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            <option value="">Tous les immeubles</option>
            {buildings.map((building: UnitBuildingListItem) => (
              <option key={building.id} value={building.id}>
                {building.name} — {building.condo.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
          >
            Filtrer
          </button>
          <Link
            href="/units"
            className="rounded-xl border border-slate-300 px-5 py-3 text-center text-base font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </Link>
        </form>
      </section>

      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Liste des unités
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consultez, modifiez ou retirez une unité.
            </p>
          </div>

          {canManageUnits ? (
            <Link
              href="/units?new=1"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Ajouter une unité
            </Link>
          ) : null}
        </div>

        {units.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucune unité pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Unité",
                    "Propriétaire",
                    "Immeuble",
                    "Contact",
                    "Caractéristiques",
                    "Assurance",
                    ...(canManageUnits ? ["Actions"] : []),
                  ].map((header: string) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white text-[15px]">
                {units.map((unit: UnitListItem) => (
                  <tr
                    key={unit.id}
                    className="border-t border-slate-200 align-middle hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="text-base font-semibold text-slate-950">
                        {unit.number}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Étage {unit.floor ?? "non précisé"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-slate-600">
                      {formatOptional(unit.ownerName)}
                    </td>
                    <td className="min-w-64 px-4 py-4">
                      <p className="text-[15px] font-medium text-slate-700">
                        {unit.building.name}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {unit.building.condo.name}
                      </p>
                    </td>
                    <td className="min-w-64 px-4 py-4 text-sm leading-6 text-slate-600">
                      <p>{unit.email ?? "Email non précisé"}</p>
                      <p>
                        {[unit.phone, unit.mobile].filter(Boolean).join(" · ") ||
                          "Téléphone non précisé"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm leading-6 text-slate-600">
                      <p>
                        {unit.squareFeet !== null
                          ? `${unit.squareFeet} pi²`
                          : "Superficie non précisée"}
                      </p>
                      <p>
                        Quote-part{" "}
                        <span className="font-semibold text-slate-700">
                          {formatQuotePart(unit.squareFeet, unit.building.units)}
                        </span>
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-slate-600">
                      {formatDate(unit.insuranceRenewalDate)}
                    </td>
                    {canManageUnits ? (
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/units?edit=${encodeURIComponent(unit.id)}`}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Modifier
                          </Link>
                          <form action={deleteUnit} className="m-0">
                            <input type="hidden" name="id" value={unit.id} />
                            <button
                              type="submit"
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50"
                            >
                              Supprimer
                            </button>
                          </form>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isNewUnitModalOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="new-unit-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                      Nouvelle unité
                    </p>
                    <h2
                      id="new-unit-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Ajouter une unité
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      Ajoutez les coordonnées du propriétaire, les
                      caractéristiques et les dates importantes de l’unité.
                    </p>
                  </div>
                  <Link
                    href="/units"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                {buildings.length === 0 ? (
                  <div className="mx-6 mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-base font-medium text-slate-500">
                    Ajoutez d’abord un immeuble avant de créer une unité.
                  </div>
                ) : null}

                <form action={createUnit}>
                  <div className="p-6">
                    <UnitFormFields
                      buildings={buildings}
                      disabled={buildings.length === 0}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/units"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      disabled={buildings.length === 0}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Ajouter l’unité
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {canManageUnits && selectedUnit ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="edit-unit-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                      Modification
                    </p>
                    <h2
                      id="edit-unit-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Modifier l’unité
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      Unité {selectedUnit.number} ·{" "}
                      {selectedUnit.building.name} —{" "}
                      {selectedUnit.building.condo.name}
                    </p>
                  </div>
                  <Link
                    href="/units"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                <form action={updateUnit}>
                  <input type="hidden" name="id" value={selectedUnit.id} />

                  <div className="p-6">
                    <UnitFormFields buildings={buildings} unit={selectedUnit} />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/units"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </>
      ) : canManageUnits && editUnitId ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="missing-unit-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-base shadow-2xl lg:p-8"
            >
              <h2
                id="missing-unit-title"
                className="text-2xl font-bold text-slate-950"
              >
                Unité introuvable
              </h2>
              <p className="mt-3 text-slate-500">
                L’unité sélectionnée n’existe pas ou n’est plus disponible.
              </p>
              <Link
                href="/units"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
              >
                Revenir à la liste
              </Link>
            </section>
          </div>
        </>
      ) : null}

    </div>
  );
}
