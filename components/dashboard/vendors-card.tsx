import { Building2 } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Badge } from "@/components/ui/badge";

type Vendor = {
  name: string;
  category: string;
  status: string;
};

type VendorsCardProps = {
  vendors: Vendor[];
};

export function VendorsCard({ vendors }: VendorsCardProps) {
  return (
    <DashboardCard title="Fournisseurs actifs" className="h-full">
      <div className="space-y-3">
        {vendors.map((vendor) => (
          <div
            key={vendor.name}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-950">
                {vendor.name}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {vendor.category}
              </p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              {vendor.status}
            </Badge>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
