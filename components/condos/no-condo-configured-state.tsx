import { CondoSectionHeader } from "@/components/condos/condo-section-header";
import { CreateCondoDialog } from "@/components/condos/create-condo-dialog";

type NoCondoConfiguredStateProps = {
  activeHref: string;
};

export function NoCondoConfiguredState({
  activeHref,
}: NoCondoConfiguredStateProps) {
  return (
    <div className="space-y-8">
      <CondoSectionHeader
        title="Copropriété"
        subtitle="Gestion de la copropriété"
        activeHref={activeHref}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:p-8">
        <h1 className="text-3xl font-bold text-slate-950">
          Aucune copropriété configurée.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Ajoutez une copropriété pour activer les informations, les unités et
          les paiements de cette section.
        </p>
        <CreateCondoDialog />
      </section>
    </div>
  );
}
