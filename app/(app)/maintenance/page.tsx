import { getMaintenanceWhereForUser } from "@/lib/auth/tenant-access";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function MaintenancePage() {
  const user = await requireUser();
  const maintenanceWhere = getMaintenanceWhereForUser(user);
  const openTaskCount = await prisma.maintenanceTask.count({
    where: {
      AND: [
        ...(maintenanceWhere ? [maintenanceWhere] : []),
        {
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      ],
    },
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-950">Entretien</h1>
      <p className="mt-3 text-lg leading-8 text-slate-600">
        Cette section suivra les tâches d’entretien ouvertes et planifiées.
      </p>
      <p className="mt-5 text-base font-semibold text-teal-700">
        {openTaskCount} tâche{openTaskCount > 1 ? "s" : ""} ouverte
        {openTaskCount > 1 ? "s" : ""} dans votre portée.
      </p>
    </div>
  );
}
