import { prisma } from "@/lib/db/prisma";


type InsuranceReminderCondo = {
  id: string;
  name: string;
};

type InsuranceReminderBuilding = {
  id: string;
  name: string;
  condo: InsuranceReminderCondo;
};

type InsuranceReminderUnit = {
  id: string;
  number: string;
  ownerName: string | null;
  mobile: string | null;
  insuranceRenewalDate: Date | null;
  building: InsuranceReminderBuilding;
};

type InsuranceReminderLogItem = {
  id: string;
  sentAt: Date | null;
  sentTo: string | null;
  status: string;
  messageBody: string | null;
  errorMessage: string | null;
  unit: {
    id: string;
    number: string;
    ownerName: string | null;
    building: InsuranceReminderBuilding;
  };
};

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "—";
}

function getDaysUntilRenewal(date: Date | null) {
  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewalDate = new Date(date);
  renewalDate.setHours(0, 0, 0, 0);

  const diffMs = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getRenewalStatus(daysUntilRenewal: number | null) {
  if (daysUntilRenewal !== null && daysUntilRenewal < 0) {
    return "Échu";
  }

  if (daysUntilRenewal === 0) {
    return "Aujourd’hui";
  }

  if (daysUntilRenewal !== null && daysUntilRenewal <= 28) {
    return "À relancer";
  }

  return "À venir";
}

function getStatusClass(status: string) {
  if (status === "Échu" || status === "ERROR") {
    return "bg-red-50 text-red-700";
  }

  if (status === "Aujourd’hui") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "À relancer") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "SENT") {
    return "bg-teal-50 text-teal-700";
  }

  if (status === "SKIPPED") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default async function InsuranceRemindersPage() {
  const [renewalUnitsRaw, reminderLogsRaw] = await Promise.all([
    prisma.unit.findMany({
      where: {
        insuranceRenewalDate: {
          not: null,
        },
      },
      include: {
        building: {
          include: {
            condo: true,
          },
        },
      },
      orderBy: {
        insuranceRenewalDate: "asc",
      },
    }),
    prisma.insuranceReminderLog.findMany({
      include: {
        unit: {
          include: {
            building: {
              include: {
                condo: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      take: 50,
    }),
  ]);

  const renewalUnits = renewalUnitsRaw as InsuranceReminderUnit[];
  const reminderLogs = reminderLogsRaw as InsuranceReminderLogItem[];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Rappels assurance
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Suivez les renouvellements d’assurance habitation et l’historique des
          rappels SMS préparés par le job.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-950">
            Prochains renouvellements
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Les unités sont triées par date de renouvellement croissante.
          </p>
        </div>

        {renewalUnits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucun renouvellement d’assurance planifié.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Date",
                    "Jours restants",
                    "Unité",
                    "Propriétaire",
                    "Cellulaire",
                    "Immeuble",
                    "Copropriété",
                    "Statut",
                  ].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {renewalUnits.map((unit: InsuranceReminderUnit) => {
                  const daysUntilRenewal = getDaysUntilRenewal(
                    unit.insuranceRenewalDate
                  );
                  const status = getRenewalStatus(daysUntilRenewal);

                  return (
                    <tr key={unit.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                        {formatDate(unit.insuranceRenewalDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-base font-semibold text-slate-700">
                        {daysUntilRenewal ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-base font-semibold text-slate-950">
                        {unit.number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                        {unit.ownerName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                        {unit.mobile ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                        {unit.building.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                        {unit.building.condo.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-950">
            Historique des rappels
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Les 50 derniers rappels journalisés par le système.
          </p>
        </div>

        {reminderLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucun rappel envoyé ou préparé pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Date d’envoi",
                    "Unité",
                    "Propriétaire",
                    "Numéro envoyé",
                    "Statut",
                    "Message",
                    "Erreur",
                  ].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reminderLogs.map((log: InsuranceReminderLogItem) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                      {formatDate(log.sentAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-base font-semibold text-slate-950">
                      {log.unit.number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                      {log.unit.ownerName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-base text-slate-600">
                      {log.sentTo ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusClass(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="min-w-96 px-4 py-4 text-sm leading-6 text-slate-600">
                      {log.messageBody}
                    </td>
                    <td className="min-w-56 px-4 py-4 text-sm leading-6 text-slate-600">
                      {log.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
