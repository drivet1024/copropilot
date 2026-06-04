import { PageTabs, type PageTab } from "@/components/layout/page-tabs";

export const condoSectionTabs: PageTab[] = [
  { label: "Copropriété", href: "/condos" },
  { label: "Unités", href: "/condos/units" },
  { label: "Conseil d’administration", href: "/condos/board" },
  { label: "Documents", href: "/condos/documents" },
  { label: "Paiements des frais de condo", href: "/condos/payments" },
  { label: "Historique", href: "/condos/history" },
];

type CondoSectionHeaderProps = {
  title?: string;
  subtitle?: string;
  activeHref?: string;
};

export function CondoSectionHeader({
  title,
  subtitle = "Gestion de la copropriété",
  activeHref,
}: CondoSectionHeaderProps) {
  const tabs = condoSectionTabs.map((tab) => ({
    ...tab,
    active: activeHref ? tab.href === activeHref : undefined,
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-6 lg:px-8">
        {title ? (
          <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className="mt-2 text-base font-semibold text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      <PageTabs tabs={tabs} className="px-2 sm:px-4" />
    </section>
  );
}
