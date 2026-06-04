import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { getCurrentCondoForManager } from "@/lib/data/condos";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const currentCondo = await getCurrentCondoForManager(user);

  return (
    <AppShell user={user} currentCondo={currentCondo ?? undefined}>
      {children}
    </AppShell>
  );
}
