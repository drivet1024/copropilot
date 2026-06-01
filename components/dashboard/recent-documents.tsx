import { FileText } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";

type DocumentItem = {
  name: string;
  date: string;
};

type RecentDocumentsProps = {
  documents: DocumentItem[];
};

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  return (
    <DashboardCard title="Documents récents" className="h-full">
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.name}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <FileText className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-950">
                {document.name}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {document.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
