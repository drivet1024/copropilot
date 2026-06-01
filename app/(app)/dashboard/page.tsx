import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage() {
  const [
    condoCount,
    buildingCount,
    unitCount,
    documentCount,
    maintenanceOpenCount,
    vendorCount,
    condos,
  ] = await Promise.all([
    prisma.condo.count(),
    prisma.building.count(),
    prisma.unit.count(),
    prisma.document.count(),
    prisma.maintenanceTask.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    }),
    prisma.vendor.count(),
    prisma.condo.findMany({
      include: {
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
  ]);

  const stats = [
    { label: "Copropriétés", value: condoCount },
    { label: "Bâtiments", value: buildingCount },
    { label: "Unités", value: unitCount },
    { label: "Documents", value: documentCount },
    { label: "Entretiens ouverts", value: maintenanceOpenCount },
    { label: "Fournisseurs", value: vendorCount },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          Tableau de bord
        </p>
        <h2 className="mt-3 text-4xl font-bold text-slate-950">
          Vue d’ensemble
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Suivez vos copropriétés, immeubles, unités, documents, entretiens et
          fournisseurs depuis un espace connecté à Prisma.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-teal-200"
          >
            <p className="text-base font-semibold text-slate-500">
              {stat.label}
            </p>
            <p className="mt-4 text-4xl font-bold text-slate-950">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-950">
            Copropriétés
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Données chargées depuis PostgreSQL avec Prisma.
          </p>
        </div>

        <div className="space-y-5">
          {condos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-base text-slate-500">
              Aucune copropriété n’a encore été créée.
            </div>
          ) : (
            condos.map((condo) => {
              const unitCountForCondo = condo.buildings.reduce(
                (total, building) => total + building.units.length,
                0
              );

              const details = [
                { label: "Bâtiments", value: condo.buildings.length },
                { label: "Unités", value: unitCountForCondo },
                { label: "Documents", value: condo.documents.length },
                { label: "Entretiens", value: condo.maintenance.length },
                { label: "Fournisseurs", value: condo.vendors.length },
              ];

              return (
                <article
                  key={condo.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40"
                >
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">
                      {condo.name}
                    </h3>
                    <p className="mt-1 text-base text-slate-500">
                      {condo.address ?? "Aucune adresse"}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {details.map((detail) => (
                      <div
                        key={detail.label}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-500">
                          {detail.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                          {detail.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
