import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type BuildingsSearchParams = Promise<{
  q?: string | string[];
  condoId?: string | string[];
  edit?: string | string[];
  new?: string | string[];
}>;

type BuildingFormCondo = {
  id: string;
  name: string;
};

type BuildingFormBuilding = {
  name?: string;
  address?: string | null;
  condoId?: string;
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

function getBuildingData(formData: FormData) {
  const name = getFormValue(formData, "name");
  const address = getFormValue(formData, "address");
  const condoId = getFormValue(formData, "condoId");

  if (!name || !condoId) {
    throw new Error("Le nom de l’immeuble et la copropriété sont obligatoires.");
  }

  return {
    name,
    address: address || null,
    condoId,
  };
}

function BuildingFormFields({
  building,
  condos,
  disabled = false,
}: {
  building?: BuildingFormBuilding;
  condos: BuildingFormCondo[];
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Nom de l’immeuble
        </span>
        <input
          name="name"
          type="text"
          required
          defaultValue={building?.name ?? ""}
          placeholder="Tour A"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Adresse</span>
        <input
          name="address"
          type="text"
          defaultValue={building?.address ?? ""}
          placeholder="123 rue Principale"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
        />
      </label>

      <label className="space-y-2 md:col-span-2 xl:col-span-1">
        <span className="text-sm font-semibold text-slate-700">
          Copropriété
        </span>
        <select
          name="condoId"
          required
          defaultValue={building?.condoId ?? ""}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
        >
          <option value="" disabled>
            Sélectionner une copropriété
          </option>
          {condos.map((condo) => (
            <option key={condo.id} value={condo.id}>
              {condo.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

async function createBuilding(formData: FormData) {
  "use server";

  await prisma.building.create({
    data: getBuildingData(formData),
  });

  revalidatePath("/buildings");
  redirect("/buildings");
}

async function updateBuilding(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de l’immeuble est obligatoire.");
  }

  await prisma.building.update({
    where: { id },
    data: getBuildingData(formData),
  });

  revalidatePath("/buildings");
  redirect("/buildings");
}

async function deleteBuilding(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de l’immeuble est obligatoire.");
  }

  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      units: true,
    },
  });

  if (!building) {
    throw new Error("Immeuble introuvable.");
  }

  if (building.units.length > 0) {
    throw new Error(
      "Impossible de supprimer cet immeuble, car des unités y sont encore associées."
    );
  }

  await prisma.building.delete({
    where: { id },
  });

  revalidatePath("/buildings");
  redirect("/buildings");
}

export default async function BuildingsPage({
  searchParams,
}: {
  searchParams?: BuildingsSearchParams;
}) {
  await requireRole(["MASTER_USER", "CONDO_MANAGER"]);

  const params = searchParams ? await searchParams : {};
  const q = getSearchParam(params.q);
  const selectedCondoId = getSearchParam(params.condoId);
  const editBuildingId = getSearchParam(params.edit);
  const isNewBuildingModalOpen =
    getSearchParam(params.new) === "1" && !editBuildingId;
  const filters = [];

  if (selectedCondoId) {
    filters.push({ condoId: selectedCondoId });
  }

  if (q) {
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { address: { contains: q, mode: "insensitive" as const } },
        {
          condo: {
            name: { contains: q, mode: "insensitive" as const },
          },
        },
      ],
    });
  }

  const buildingWhere = filters.length > 0 ? { AND: filters } : undefined;

  const [buildings, condos, selectedBuilding] = await Promise.all([
    prisma.building.findMany({
      where: buildingWhere,
      include: {
        condo: true,
        units: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.condo.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    editBuildingId
      ? prisma.building.findUnique({
          where: { id: editBuildingId },
          include: {
            condo: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const totalUnits = buildings.reduce(
    (total, building) => total + building.units.length,
    0
  );
  const buildingsWithoutUnits = buildings.filter(
    (building) => building.units.length === 0
  ).length;
  const linkedCondoCount = new Set(
    buildings.map((building) => building.condoId)
  ).size;

  const kpis = [
    { label: "Total immeubles", value: buildings.length },
    { label: "Copropriétés liées", value: linkedCondoCount },
    { label: "Unités totales", value: totalUnits },
    { label: "Immeubles sans unités", value: buildingsWithoutUnits },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">Immeubles</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Gérez les immeubles associés à vos copropriétés.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
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
            Recherchez par nom, adresse ou copropriété, puis filtrez au besoin.
          </p>
        </div>

        <form
          method="GET"
          className="mt-6 grid gap-4 md:grid-cols-[1fr_260px_auto_auto]"
        >
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher par nom, adresse ou copropriété"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          />
          <select
            name="condoId"
            defaultValue={selectedCondoId}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            <option value="">Toutes les copropriétés</option>
            {condos.map((condo) => (
              <option key={condo.id} value={condo.id}>
                {condo.name}
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
            href="/buildings"
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
              Liste des immeubles
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consultez, modifiez ou retirez un immeuble. La suppression est
              bloquée dès qu’une unité est associée.
            </p>
          </div>

          <Link
            href="/buildings?new=1"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Ajouter un immeuble
          </Link>
        </div>

        {buildings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucun immeuble pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Immeuble",
                    "Adresse",
                    "Copropriété",
                    "Unités",
                    "Créé le",
                    "Actions",
                  ].map((header) => (
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
                {buildings.map((building) => (
                  <tr
                    key={building.id}
                    className="border-t border-slate-200 align-middle hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-base font-semibold text-slate-950">
                      {building.name}
                    </td>
                    <td className="min-w-72 px-4 py-4 text-slate-600">
                      {building.address ?? "Aucune adresse"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {building.condo.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
                        {building.units.length}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {dateFormatter.format(building.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/buildings?edit=${encodeURIComponent(
                            building.id
                          )}`}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Modifier
                        </Link>
                        <form action={deleteBuilding} className="m-0">
                          <input type="hidden" name="id" value={building.id} />
                          <button
                            type="submit"
                            disabled={building.units.length > 0}
                            title={
                              building.units.length > 0
                                ? "Retirez d’abord les unités associées."
                                : undefined
                            }
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isNewBuildingModalOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="new-building-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                      Nouvel immeuble
                    </p>
                    <h2
                      id="new-building-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Ajouter un immeuble
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      Créez un immeuble et rattachez-le à une copropriété.
                    </p>
                  </div>
                  <Link
                    href="/buildings"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                {condos.length === 0 ? (
                  <div className="mx-6 mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-base font-medium text-slate-500">
                    Ajoutez d’abord une copropriété avant de créer un immeuble.
                  </div>
                ) : null}

                <form action={createBuilding}>
                  <div className="p-6">
                    <BuildingFormFields
                      condos={condos}
                      disabled={condos.length === 0}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/buildings"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      disabled={condos.length === 0}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Ajouter l’immeuble
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {selectedBuilding ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="edit-building-title"
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
                      id="edit-building-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Modifier l’immeuble
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      {selectedBuilding.name} · {selectedBuilding.condo.name}
                    </p>
                  </div>
                  <Link
                    href="/buildings"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                <form action={updateBuilding}>
                  <input type="hidden" name="id" value={selectedBuilding.id} />

                  <div className="p-6">
                    <BuildingFormFields
                      building={selectedBuilding}
                      condos={condos}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/buildings"
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
      ) : editBuildingId ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="missing-building-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-base shadow-2xl lg:p-8"
            >
              <h2
                id="missing-building-title"
                className="text-2xl font-bold text-slate-950"
              >
                Immeuble introuvable
              </h2>
              <p className="mt-3 text-slate-500">
                L’immeuble sélectionné n’existe pas ou n’est plus disponible.
              </p>
              <Link
                href="/buildings"
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
