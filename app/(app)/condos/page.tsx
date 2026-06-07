import { redirect } from "next/navigation";

import { CondoInformationForm } from "@/components/condos/condo-information-form";
import { CondoCreationSuccessMessage } from "@/components/condos/condo-creation-success-message";
import { CondoSectionHeader } from "@/components/condos/condo-section-header";
import { NoCondoConfiguredState } from "@/components/condos/no-condo-configured-state";
import { requireUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";

export default async function CondosPage() {
  const user = await requireUser();

  if (user.role === "OWNER") {
    redirect("/dashboard");
  }

  const condo = await getCurrentCondoForManager(user);

  if (!condo) {
    return <NoCondoConfiguredState activeHref="/condos" />;
  }

  return (
    <div className="space-y-8">
      <CondoSectionHeader
        title={condo.name}
        subtitle="Gestion de la copropriété"
        activeHref="/condos"
      />

      <CondoCreationSuccessMessage />
      <CondoInformationForm condo={condo} />
    </div>
  );
}
