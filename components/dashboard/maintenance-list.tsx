import { CalendarClock, MapPin } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Badge } from "@/components/ui/badge";

type MaintenanceTask = {
  title: string;
  property: string;
  date: string;
  dueIn: string;
};

type MaintenanceListProps = {
  tasks: MaintenanceTask[];
};

export function MaintenanceList({ tasks }: MaintenanceListProps) {
  return (
    <DashboardCard title="Entretiens à venir" className="h-full">
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={`${task.title}-${task.property}`}
            className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <CalendarClock className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-medium leading-6 text-slate-950">
                  {task.title}
                </h3>
                <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">
                  {task.dueIn}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {task.property}
                </span>
                <span>{task.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
