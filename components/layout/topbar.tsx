import { Bell, ChevronDown, Menu, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="lg:hidden"
        aria-label="Ouvrir la navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <div className="relative max-w-xl flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Rechercher une copropriété, un document..."
          className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:border-sky-300 focus-visible:ring-sky-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="relative rounded-2xl border-slate-200 bg-white"
          aria-label="Notifications"
        >
          <Bell className="size-5 text-slate-600" aria-hidden="true" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-teal-500" />
        </Button>

        <button
          type="button"
          className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:bg-slate-50 sm:flex"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-sky-100 text-sm font-semibold text-sky-700">
              DB
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-slate-950">
              Daniel B.
            </span>
            <span className="block text-xs font-medium leading-4 text-slate-500">
              Gestionnaire
            </span>
          </span>
          <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
