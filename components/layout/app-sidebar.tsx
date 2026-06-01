"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Building,
  Building2,
  CalendarCheck,
  FileText,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Copropriétés", href: "/condos", icon: Home },
  { label: "Immeubles", href: "/buildings", icon: Building2 },
  { label: "Unités", href: "/units", icon: Building },
  { label: "Rappels assurance", href: "/insurance-reminders", icon: CalendarCheck },
  { label: "Templates SMS", href: "/sms-templates", icon: MessageSquare },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Entretien", href: "/maintenance", icon: CalendarCheck },
  { label: "Fonds de prévoyance", href: "/reserve-fund", icon: Landmark },
  { label: "Fournisseurs", href: "/vendors", icon: Handshake },
  { label: "Assistant IA", href: "/ai-assistant", icon: Bot },
];

const adminNavigationItems = [
  { label: "Utilisateurs", href: "/users", icon: Users },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const visibleNavigationItems =
    user.role === "MASTER_USER"
      ? [...navigationItems, ...adminNavigationItems]
      : navigationItems;

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
          Portefeuille actif
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Données synchronisées avec PostgreSQL.
        </p>
      </div>
    </aside>
  );
}
