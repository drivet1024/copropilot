import { CalendarDays } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";

type CalendarEvent = {
  day: string;
  date: string;
  title: string;
  time: string;
  tone: string;
};

type MaintenanceCalendarProps = {
  events: CalendarEvent[];
};

export function MaintenanceCalendar({ events }: MaintenanceCalendarProps) {
  return (
    <DashboardCard
      title="Calendrier des entretiens"
      className="h-full"
      action={
        <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <CalendarDays className="size-5" aria-hidden="true" />
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {events.map((event) => (
          <div
            key={`${event.day}-${event.title}`}
            className="min-h-40 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {event.day}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {event.date}
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500">
                {event.time}
              </span>
            </div>
            <div
              className={`mt-5 rounded-2xl border p-3 text-sm font-medium ${event.tone}`}
            >
              {event.title}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
