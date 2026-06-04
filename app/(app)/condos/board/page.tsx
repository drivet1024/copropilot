import { redirect } from "next/navigation";

import { CondoSectionHeader } from "@/components/condos/condo-section-header";
import { NoCondoConfiguredState } from "@/components/condos/no-condo-configured-state";
import { requireUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";

export default async function CondoBoardPage() {
  const user = await requireUser();

  if (user.role === "OWNER") {
    redirect("/dashboard");
  }

  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return <NoCondoConfiguredState activeHref="/condos/board" />;
  }

  return (
    <div className="space-y-8">
      <CondoSectionHeader
        title={condo.name}
        subtitle="Gestion de la copropriété"
        activeHref="/condos/board"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:p-8">
        <h1 className="text-3xl font-bold text-slate-950">
          Conseil d’administration
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Cette vue présentera les membres du CA, leurs rôles et leurs mandats.
        </p>
      </section>
    </div>
  );
}
