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

const FALLBACK_ORGANIZATION_NAME = "Organisation principale";

type CondosSearchParams = Promise<{
  q?: string | string[];
  organizationId?: string | string[];
  edit?: string | string[];
  new?: string | string[];
}>;

type CondoFormOrganization = {
  id: string;
  name: string;
};

type CondoFormCondo = {
  name?: string;
  address?: string | null;
  organizationId?: string;
};

type TextSearchFilter = {
  contains: string;
  mode: "insensitive";
};

type CondoWhereFilter = {
  organizationId?: string;
  OR?: Array<{
    name?: TextSearchFilter;
    address?: TextSearchFilter;
    organization?: {
      name: TextSearchFilter;
    };
  }>;
};

type CondoBuildingListItem = {
  id: string;
  units: Array<{ id: string }>;
};

type CondoListItem = {
  id: string;
  name: string;
  address: string | null;
  organizationId: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
  };
  buildings: CondoBuildingListItem[];
  documents: Array<{ id: string }>;
  maintenance: Array<{ id: string }>;
  vendors: Array<{ id: string }>;
};

type SelectedCondoItem = {
  id: string;
  name: string;
  address: string | null;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
};

type CondoTotals = {
  buildings: number;
  documents: number;
  maintenance: number;
  units: number;
  vendors: number;
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

async function getCondoOrganizationId() {
  const organization = await prisma.organization.findFirst({
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (organization) {
    return organization.id;
  }

  const createdOrganization = await prisma.organization.create({
    data: {
      name: FALLBACK_ORGANIZATION_NAME,
    },
    select: {
      id: true,
    },
  });

  return createdOrganization.id;
}

async function getCondoData(formData: FormData) {
  const name = getFormValue(formData, "name");
  const address = getFormValue(formData, "address");
  const selectedOrganizationId = getFormValue(formData, "organizationId");

  if (!name) {
    throw new Error("Le nom de la copropriété est obligatoire.");
  }

  return {
    name,
    address: address || null,
    organizationId: selectedOrganizationId || (await getCondoOrganizationId()),
  };
}

function CondoFormFields({
  condo,
  organizations,
}: {
  condo?: CondoFormCondo;
  organizations: CondoFormOrganization[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Nom de la copropriété
        </span>
        <input
          name="name"
          type="text"
          required
          defaultValue={condo?.name ?? ""}
          placeholder="Résidence du Parc"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Adresse</span>
        <input
          name="address"
          type="text"
          defaultValue={condo?.address ?? ""}
          placeholder="123 rue Principale"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />
      </label>

      {organizations.length > 0 ? (
        <label className="space-y-2 md:col-span-2 xl:col-span-1">
          <span className="text-sm font-semibold text-slate-700">
            Organisation
          </span>
          <select
            name="organizationId"
            required
            defaultValue={condo?.organizationId ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            <option value="" disabled>
              Sélectionner une organisation
            </option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

async function createCondo(formData: FormData) {
  "use server";

  await prisma.condo.create({
    data: await getCondoData(formData),
  });

  revalidatePath("/condos");
  redirect("/condos");
}

async function updateCondo(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de la copropriété est obligatoire.");
  }

  await prisma.condo.update({
    where: { id },
    data: await getCondoData(formData),
  });

  revalidatePath("/condos");
  redirect("/condos");
}

async function deleteCondo(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de la copropriété est obligatoire.");
  }

  const condo = await prisma.condo.findUnique({
    where: { id },
    include: {
      buildings: true,
      documents: true,
      maintenance: true,
      vendors: true,
    },
  });

  if (!condo) {
    throw new Error("Copropriété introuvable.");
  }

  if (
    condo.buildings.length > 0 ||
    condo.documents.length > 0 ||
    condo.maintenance.length > 0 ||
    condo.vendors.length > 0
  ) {
    throw new Error(
      "Impossible de supprimer cette copropriété, car des dossiers y sont encore associés."
    );
  }

  await prisma.condo.delete({
    where: { id },
  });

  revalidatePath("/condos");
  redirect("/condos");
}

export default async function CondosPage({
  searchParams,
}: {
  searchParams?: CondosSearchParams;
}) {
  await requireRole(["MASTER_USER", "CONDO_MANAGER"]);

  const params = searchParams ? await searchParams : {};
  const q = getSearchParam(params.q);
  const selectedOrganizationId = getSearchParam(params.organizationId);
  const editCondoId = getSearchParam(params.edit);
  const isNewCondoModalOpen =
    getSearchParam(params.new) === "1" && !editCondoId;
  const filters: CondoWhereFilter[] = [];

  if (selectedOrganizationId) {
    filters.push({ organizationId: selectedOrganizationId });
  }

  if (q) {
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { address: { contains: q, mode: "insensitive" as const } },
        {
          organization: {
            name: { contains: q, mode: "insensitive" as const },
          },
        },
      ],
    });
  }

  const condoWhere = filters.length > 0 ? { AND: filters } : undefined;

  const [condosRaw, organizationsRaw, selectedCondoRaw] = await Promise.all([
    prisma.condo.findMany({
      where: condoWhere,
      include: {
        organization: true,
        buildings: {
          include: {
            units: true,
          },
        },
        documents: true,
        maintenance: true,
        vendors: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.organization.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    editCondoId
      ? prisma.condo.findUnique({
          where: { id: editCondoId },
          include: {
            organization: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const condos = condosRaw as CondoListItem[];
  const organizations = organizationsRaw as CondoFormOrganization[];
  const selectedCondo = selectedCondoRaw as SelectedCondoItem | null;

  const totals = condos.reduce(
    (summary: CondoTotals, condo: CondoListItem) => {
      const unitCount = condo.buildings.reduce(
        (total: number, building: CondoBuildingListItem) =>
          total + building.units.length,
        0
      );

      return {
        buildings: summary.buildings + condo.buildings.length,
        documents: summary.documents + condo.documents.length,
        maintenance: summary.maintenance + condo.maintenance.length,
        units: summary.units + unitCount,
        vendors: summary.vendors + condo.vendors.length,
      };
    },
    {
      buildings: 0,
      documents: 0,
      maintenance: 0,
      units: 0,
      vendors: 0,
    } satisfies CondoTotals
  );

  const kpis = [
    { label: "Copropriétés", value: condos.length },
    { label: "Immeubles", value: totals.buildings },
    { label: "Unités", value: totals.units },
    { label: "Documents", value: totals.documents },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Copropriétés
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Gérez les copropriétés, leurs immeubles, unités et dossiers associés.
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
            Recherchez par nom, adresse ou organisation, puis filtrez au besoin.
          </p>
        </div>

        <form
          method="GET"
          className="mt-6 grid gap-4 md:grid-cols-[1fr_280px_auto_auto]"
        >
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher par nom, adresse ou organisation"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          />
          <select
            name="organizationId"
            defaultValue={selectedOrganizationId}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            <option value="">Toutes les organisations</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
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
            href="/condos"
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
              Liste des copropriétés
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consultez les copropriétés et leurs dossiers opérationnels.
            </p>
          </div>

          <Link
            href="/condos?new=1"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Ajouter une copropriété
          </Link>
        </div>

        {condos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucune copropriété pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Copropriété",
                    "Adresse",
                    "Organisation",
                    "Immeubles",
                    "Unités",
                    "Documents",
                    "Entretiens",
                    "Fournisseurs",
                    "Créée le",
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
                {condos.map((condo: CondoListItem) => {
                  const unitCount = condo.buildings.reduce(
                    (total: number, building: CondoBuildingListItem) =>
                      total + building.units.length,
                    0
                  );
                  const isDeleteBlocked =
                    condo.buildings.length > 0 ||
                    condo.documents.length > 0 ||
                    condo.maintenance.length > 0 ||
                    condo.vendors.length > 0;

                  return (
                    <tr
                      key={condo.id}
                      className="border-t border-slate-200 align-middle hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-base font-semibold text-slate-950">
                        {condo.name}
                      </td>
                      <td className="min-w-72 px-4 py-4 text-slate-600">
                        {condo.address ?? "Aucune adresse"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {condo.organization.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                          {condo.buildings.length}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
                          {unitCount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {condo.documents.length}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {condo.maintenance.length}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {condo.vendors.length}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {dateFormatter.format(condo.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/condos?edit=${encodeURIComponent(
                              condo.id
                            )}`}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Modifier
                          </Link>
                          <form action={deleteCondo} className="m-0">
                            <input type="hidden" name="id" value={condo.id} />
                            <button
                              type="submit"
                              disabled={isDeleteBlocked}
                              title={
                                isDeleteBlocked
                                  ? "Retirez d’abord les dossiers associés."
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isNewCondoModalOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="new-condo-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                      Nouvelle copropriété
                    </p>
                    <h2
                      id="new-condo-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Ajouter une copropriété
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      Créez une copropriété avec son adresse et son
                      organisation.
                    </p>
                  </div>
                  <Link
                    href="/condos"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                {organizations.length === 0 ? (
                  <div className="mx-6 mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-base font-medium text-slate-500">
                    Une organisation principale sera créée automatiquement.
                  </div>
                ) : null}

                <form action={createCondo}>
                  <div className="p-6">
                    <CondoFormFields organizations={organizations} />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/condos"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
                    >
                      Ajouter la copropriété
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {selectedCondo ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="edit-condo-title"
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
                      id="edit-condo-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Modifier la copropriété
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      {selectedCondo.name} · {selectedCondo.organization.name}
                    </p>
                  </div>
                  <Link
                    href="/condos"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                <form action={updateCondo}>
                  <input type="hidden" name="id" value={selectedCondo.id} />

                  <div className="p-6">
                    <CondoFormFields
                      condo={selectedCondo}
                      organizations={organizations}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/condos"
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
      ) : editCondoId ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="missing-condo-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-base shadow-2xl lg:p-8"
            >
              <h2
                id="missing-condo-title"
                className="text-2xl font-bold text-slate-950"
              >
                Copropriété introuvable
              </h2>
              <p className="mt-3 text-slate-500">
                La copropriété sélectionnée n’existe pas ou n’est plus
                disponible.
              </p>
              <Link
                href="/condos"
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
