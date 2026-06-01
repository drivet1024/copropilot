import Link from "next/link";
import { ArrowUpRight, TrendingUp, WalletCards } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Button } from "@/components/ui/button";

const projection = [
  { year: "2024", value: "42%" },
  { year: "2025", value: "52%" },
  { year: "2026", value: "48%" },
  { year: "2027", value: "64%" },
  { year: "2028", value: "72%" },
  { year: "2029", value: "80%" },
];

export function ReserveFundCard() {
  return (
    <DashboardCard
      title="Fonds de prévoyance"
      className="h-full"
      action={
        <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <WalletCards className="size-5" aria-hidden="true" />
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Solde actuel</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">
              1 245 680 $
            </p>
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
              <TrendingUp className="size-3.5" aria-hidden="true" />
              +8,4% vs l’an dernier
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-sky-50 to-white p-4">
          <div className="flex h-36 items-end gap-3">
            {projection.map((item) => (
              <div key={item.year} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end rounded-full bg-white shadow-inner">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-teal-500 to-sky-500"
                    style={{ height: item.value }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {item.year}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button asChild variant="ghost" className="h-auto px-0 text-sky-700 hover:bg-transparent">
          <Link href="/reserve-fund">
            Voir le rapport complet
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}
