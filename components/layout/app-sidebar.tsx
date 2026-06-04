"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import {
  getNavigationForRole,
  type NavigationContext,
  type UserRole,
} from "@/lib/permissions/navigation";
import { cn } from "@/lib/utils";

type SidebarUser = {
  role: UserRole;
};

type AppSidebarProps = {
  user: SidebarUser;
  currentCondo?: NavigationContext["currentCondo"];
};

export function AppSidebar({ user, currentCondo }: AppSidebarProps) {
  const pathname = usePathname();
  const visibleNavigationItems = getNavigationForRole(user.role, {
    currentCondo,
  });
  const isOwner = user.role === "OWNER";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white px-5 py-7 shadow-[8px_0_30px_rgba(15,23,42,0.04)] lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-1">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
          <Building2 className="size-6 text-teal-300" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-950">
            CoproPilot
          </p>
          <p className="text-sm font-medium text-slate-500">
            Gestion immobilière
          </p>
        </div>
      </Link>

      <nav className="mt-9 flex flex-1 flex-col gap-1.5">
        {visibleNavigationItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/") ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                active &&
                  "bg-teal-50 text-teal-700 shadow-sm shadow-teal-100 hover:bg-teal-50 hover:text-teal-700"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-base font-bold text-slate-950">
          {isOwner ? "Portail copropriétaire" : "Portefeuille actif"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isOwner
            ? "Accès à votre copropriété, votre unité et vos documents."
            : "Modules principaux. Les sous-sections sont dans les pages."}
        </p>
      </div>
    </aside>
  );
}
