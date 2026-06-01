import type { LucideIcon } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
};

export function KpiCard({ label, value, icon: Icon, accent }: KpiCardProps) {
  return (
    <DashboardCard contentClassName="pb-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${accent}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </DashboardCard>
  );
}
