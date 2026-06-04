import { ShieldAlert } from "lucide-react";

import { CondoSectionHeader } from "@/components/condos/condo-section-header";
import { NoCondoConfiguredState } from "@/components/condos/no-condo-configured-state";
import { CondoFeePaymentsTable } from "@/components/payments/condo-fee-payments-table";
import { requireUser } from "@/lib/auth/session";
import { getCondoFeePaymentSummariesForCurrentCondo } from "@/lib/data/condo-fee-payments";
import type { UserRole } from "@/lib/permissions/navigation";

const allowedRoles: UserRole[] = [
  "MASTER_USER",
  "CONDO_MANAGER",
  "BOARD_MEMBER",
  "VIEWER",
];

function getFiscalYearLabel(start: Date, end: Date) {
  return start.getFullYear() === end.getFullYear()
    ? String(end.getFullYear())
    : `${start.getFullYear()}-${end.getFullYear()}`;
}

export default async function CondoFeePaymentsPage() {
  const user = await requireUser();

  const canViewGlobalPayments = allowedRoles.includes(user.role);
  const readOnly =
    user.role === "BOARD_MEMBER" || user.role === "VIEWER";

  if (!canViewGlobalPayments) {
    return (
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-600">
                Accès limité
              </p>
              <h1 className="mt-3 text-4xl font-bold text-slate-950">
                Paiements des frais de condo
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Les copropriétaires ne peuvent pas consulter le tableau global
                des paiements de toutes les unités.
              </p>
              <p className="mt-3 text-base font-semibold text-slate-500">
                Une vue limitée à votre propre unité sera ajoutée plus tard.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const paymentSummaries = await getCondoFeePaymentSummariesForCurrentCondo(
    user
  );

  if (!paymentSummaries) {
    return <NoCondoConfiguredState activeHref="/condos/payments" />;
  }

  const fiscalYearLabel = getFiscalYearLabel(
    paymentSummaries.fiscalYearRange.start,
    paymentSummaries.fiscalYearRange.end
  );

  return (
    <div className="space-y-8">
      <CondoSectionHeader
        title={paymentSummaries.condo.name}
        subtitle="Gestion de la copropriété"
        activeHref="/condos/payments"
      />


      <CondoFeePaymentsTable
        summaries={paymentSummaries.summaries}
        fiscalYearOptions={[fiscalYearLabel]}
        readOnly={readOnly}
      />
    </div>
  );
}
