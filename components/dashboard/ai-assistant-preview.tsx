import { Bot, Sparkles, UserRound } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";

type AiAssistantPreviewProps = {
  question: string;
  answer: string;
};

export function AiAssistantPreview({
  question,
  answer,
}: AiAssistantPreviewProps) {
  return (
    <DashboardCard
      title="Assistant IA CoproPilot"
      className="h-full bg-gradient-to-br from-white via-sky-50/70 to-teal-50/80"
      action={
        <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-600 text-white">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
            <UserRound className="size-4" aria-hidden="true" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
            {question}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
            <Bot className="size-4" aria-hidden="true" />
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-sky-100 bg-white/90 p-4 text-sm leading-6 text-slate-700 shadow-sm">
            {answer}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
