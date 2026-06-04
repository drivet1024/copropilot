"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type PageTab = {
  label: string;
  href: string;
  active?: boolean;
};

type PageTabsProps = {
  tabs: PageTab[];
  className?: string;
};

export function PageTabs({ tabs, className }: PageTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "overflow-x-auto border-b border-slate-200",
        className
      )}
    >
      <nav className="flex min-w-max items-end gap-1" aria-label="Onglets">
        {tabs.map((tab) => {
          const active =
            tab.active ??
            (tab.href === "/condos"
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-12 items-center justify-center px-4 text-sm font-bold text-slate-500 transition hover:text-slate-950",
                active && "text-sky-700"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-transparent transition",
                  active && "bg-sky-600"
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
