import { redirect } from "next/navigation";

import { CondoSectionHeader } from "@/components/condos/condo-section-header";
import { NoCondoConfiguredState } from "@/components/condos/no-condo-configured-state";
import { UnitsTable } from "@/components/condos/units-table";
import { requireUser } from "@/lib/auth/session";
import { getUnitsForCurrentCondo } from "@/lib/data/units";

export default async function CondoUnitsPage() {
  const user = await requireUser();

  if (user.role === "OWNER") {
    redirect("/dashboard");
  }

  const currentCondoUnits = await getUnitsForCurrentCondo(user);

  if (!currentCondoUnits) {
    return <NoCondoConfiguredState activeHref="/condos/units" />;
  }

  const { buildings, condo, units } = currentCondoUnits;
  const canManageUnits =
    user.role === "MASTER_USER" || user.role === "CONDO_MANAGER";

  return (
    <div className="space-y-8">
      <CondoSectionHeader
        title={condo.name}
        subtitle="Gestion de la copropriété"
        activeHref="/condos/units"
      />


      <UnitsTable
        buildings={buildings}
        canManageUnits={canManageUnits}
        condoName={condo.name}
        units={units}
        showBuildingColumn={buildings.length > 1}
      />
    </div>
  );
}
