import Link from "next/link";

import { ResetDatabaseCard } from "@/components/settings/reset-database-card";
import { requireRole } from "@/lib/auth/session";

export default async function SettingsPage() {
  await requireRole(["MASTER_USER", "CONDO_MANAGER"]);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Paramètres
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Configurez les services et préférences de la plateforme.
        </p>
      </section>

      <ResetDatabaseCard />

      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          href="/settings/twilio"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <p className="text-xl font-bold text-slate-950">
            Configuration Twilio
          </p>
          <p className="mt-2 text-base leading-7 text-slate-500">
            Préparez les identifiants SMS et activez l&apos;envoi lorsque vous serez
            prêt.
          </p>
        </Link>
      </section>
    </div>
  );
}