import type { ReactNode } from "react";
import Link from "next/link";

import { AppSidebar } from "@/components/layout/app-sidebar";
import type { UserRole } from "@/lib/permissions/navigation";

type AppShellUser = {
  name: string | null;
  email: string;
  role: UserRole;
};

type AppShellCondo = {
  name: string;
  buildingCount: number;
};

type AppShellProps = {
  user: AppShellUser;
  currentCondo?: AppShellCondo;
  children: ReactNode;
};

const roleLabels: Record<UserRole, string> = {
  MASTER_USER: "Administrateur",
  CONDO_MANAGER: "Gestionnaire",
  BOARD_MEMBER: "Membre du CA",
  OWNER: "Copropriétaire",
  VIEWER: "Lecture seule",
};

export function AppShell({ user, currentCondo, children }: AppShellProps) {
  const isOwner = user.role === "OWNER";
  const workspaceLabel = isOwner
    ? currentCondo?.name ?? "Copropriété assignée"
    : currentCondo?.name ?? "Toutes les copropriétés";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AppSidebar user={user} currentCondo={currentCondo} />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm shadow-slate-200/40 backdrop-blur">
          <div className="flex min-h-24 flex-col justify-center gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                CoproPilot
              </h1>
              <p className="mt-1 text-base text-slate-500">
                {isOwner ? "Portail copropriétaire" : "Espace administrateur"}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {user.name ?? user.email}
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {roleLabels[user.role]}
                </p>
                <p className="mt-1 text-sm font-semibold text-teal-700">
                  {workspaceLabel}
                </p>
              </div>
              <Link
                href="/logout"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Déconnexion
              </Link>
            </div>
          </div>
        </header>

        <main className="w-full p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
