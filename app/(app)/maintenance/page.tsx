import type { MaintenanceOccurrenceStatus } from "@prisma/client";

import { MaintenanceOccurrenceActions } from "@/components/maintenance/maintenance-occurrence-actions";
import { Badge } from "@/components/ui/badge";
import { getMaintenanceItemWhereForUser } from "@/lib/auth/tenant-access";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const statusLabels: Record<MaintenanceOccurrenceStatus, string> = {
  CANCELLED: "Annulée",
  COMPLETED: "Complétée",
  IN_PROGRESS: "En cours",
  PLANNED: "Planifiée",
  POSTPONED: "Reportée",
  TODO: "À faire",
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Non planifiée";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthLabel(month: number) {
  return new Intl.DateTimeFormat("fr-CA", {
    month: "long",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));
}

function typeLabel(value: string) {
  return value === "court_terme" ? "Court terme" : "Long terme";
}

function statusBadgeClassName(status: MaintenanceOccurrenceStatus) {
  if (status === "COMPLETED") {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }

  if (status === "CANCELLED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (status === "POSTPONED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

type MaintenanceItemWithOccurrences = Awaited<
  ReturnType<typeof getMaintenanceItems>
>[number];

type MaintenanceOccurrenceWithItem =
  MaintenanceItemWithOccurrences["occurrences"][number] & {
    maintenanceItem: MaintenanceItemWithOccurrences;
  };

async function getMaintenanceItems() {
  const user = await requireUser();
  const where = getMaintenanceItemWhereForUser(user);

  const items = await prisma.maintenanceItem.findMany({
    where,
    orderBy: [
      { categoryNumber: "asc" },
      { elementCode: "asc" },
      { sourceRow: "asc" },
    ],
    include: {
      occurrences: {
        orderBy: {
          plannedDate: "asc",
        },
      },
    },
  });

  return items;
}

function nextOpenOccurrence(item: MaintenanceItemWithOccurrences) {
  return item.occurrences.find(
    (occurrence) =>
      occurrence.status !== "COMPLETED" && occurrence.status !== "CANCELLED"
  );
}

function MaintenanceTable({
  canManage,
  items,
}: {
  canManage: boolean;
  items: MaintenanceItemWithOccurrences[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            {[
              "Catégorie",
              "Élément",
              "Description",
              "Fréquence",
              "Mois",
              "Effectué par",
              "Payé par",
              "Type",
              "Prochaine occurrence",
              "Statut",
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
          {items.map((item) => {
            const occurrence = nextOpenOccurrence(item);

            return (
              <tr key={item.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-3 text-slate-600">
                  {[item.categoryNumber, item.categoryName].filter(Boolean).join(" - ") ||
                    "Non défini"}
                </td>
                <td className="px-3 py-3 font-bold text-slate-950">
                  {item.elementCode}
                </td>
                <td className="max-w-[300px] px-3 py-3 font-semibold text-slate-700">
                  {item.description}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.frequencyText ?? "Non défini"}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.monthText ?? "Non défini"}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.performedBy ?? "Non défini"}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.paidBy ?? "Non défini"}
                </td>
                <td className="px-3 py-3 font-bold text-teal-700">
                  {typeLabel(item.maintenanceType)}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {formatDate(occurrence?.plannedDate ?? null)}
                </td>
                <td className="px-3 py-3">
                  {occurrence ? (
                    <Badge className={statusBadgeClassName(occurrence.status)}>
                      {statusLabels[occurrence.status]}
                    </Badge>
                  ) : (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      À planifier
                    </Badge>
                  )}
                </td>
                <td className="w-[260px] px-3 py-3">
                  {canManage && occurrence ? (
                    <MaintenanceOccurrenceActions
                      occurrenceId={occurrence.id}
                      plannedDate={dateInputValue(occurrence.plannedDate)}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      Aucune action
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OccurrenceList({
  canManage,
  emptyLabel,
  occurrences,
}: {
  canManage: boolean;
  emptyLabel: string;
  occurrences: MaintenanceOccurrenceWithItem[];
}) {
  if (occurrences.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {occurrences.map((occurrence) => (
        <div
          key={occurrence.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-950">
                {occurrence.maintenanceItem.description}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {occurrence.maintenanceItem.elementCode} ·{" "}
                {formatDate(occurrence.plannedDate)}
              </p>
            </div>
            <Badge className={statusBadgeClassName(occurrence.status)}>
              {statusLabels[occurrence.status]}
            </Badge>
          </div>
          {occurrence.note ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {occurrence.note}
            </p>
          ) : null}
          {canManage && occurrence.status !== "COMPLETED" && occurrence.status !== "CANCELLED" ? (
            <div className="mt-4">
              <MaintenanceOccurrenceActions
                occurrenceId={occurrence.id}
                plannedDate={dateInputValue(occurrence.plannedDate)}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default async function MaintenancePage() {
  const user = await requireUser();
  const canManage = ["MASTER_USER", "CONDO_MANAGER"].includes(user.role);
  const items = await getMaintenanceItems();
  const occurrences = items.flatMap((item) =>
    item.occurrences.map((occurrence) => ({
      ...occurrence,
      maintenanceItem: item,
    }))
  );
  const now = new Date();
  const in90Days = new Date(now);
  in90Days.setDate(in90Days.getDate() + 90);

  const upcomingOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.plannedDate >= now &&
      occurrence.plannedDate <= in90Days &&
      occurrence.status !== "COMPLETED" &&
      occurrence.status !== "CANCELLED"
  );
  const overdueOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.plannedDate < now &&
      occurrence.status !== "COMPLETED" &&
      occurrence.status !== "CANCELLED"
  );
  const completedOccurrences = occurrences.filter(
    (occurrence) => occurrence.status === "COMPLETED"
  );
  const calendarOccurrences = occurrences.filter(
    (occurrence) =>
      occurrence.status !== "CANCELLED" && occurrence.plannedYear === now.getFullYear()
  );
  const byMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      month,
      occurrences: calendarOccurrences.filter(
        (occurrence) => occurrence.plannedMonth === month
      ),
    };
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Carnet d’entretien
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Consultez, suivez et gérez les tâches d’entretien déjà importées.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Tâches
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Occurrences
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {occurrences.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            À venir
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {upcomingOccurrences.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            En retard
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {overdueOccurrences.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Historique
          </p>
          <p className="mt-2 text-3xl font-bold text-teal-700">
            {completedOccurrences.length}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Liste des tâches</h2>
        <MaintenanceTable canManage={canManage} items={items} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Calendrier</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {byMonth.map(({ month, occurrences: monthOccurrences }) => (
            <div
              key={month}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-sm font-bold capitalize text-slate-950">
                {monthLabel(month)}
              </h3>
              <div className="mt-3 space-y-2">
                {monthOccurrences.length > 0 ? (
                  monthOccurrences.slice(0, 5).map((occurrence) => (
                    <div
                      key={occurrence.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <p className="text-xs font-bold text-slate-800">
                        {occurrence.maintenanceItem.elementCode}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {occurrence.maintenanceItem.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-400">
                    Aucune occurrence
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Tâches à venir</h2>
        <OccurrenceList
          canManage={canManage}
          emptyLabel="Aucune occurrence prévue dans les 90 prochains jours."
          occurrences={upcomingOccurrences}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Tâches en retard</h2>
        <OccurrenceList
          canManage={canManage}
          emptyLabel="Aucune occurrence en retard."
          occurrences={overdueOccurrences}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Historique</h2>
        <OccurrenceList
          canManage={canManage}
          emptyLabel="Aucune occurrence complétée."
          occurrences={completedOccurrences}
        />
      </section>
    </div>
  );
}
