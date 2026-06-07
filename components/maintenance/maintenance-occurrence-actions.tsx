"use client";

import { useState, useTransition } from "react";

import {
  cancelMaintenanceOccurrenceAction,
  completeMaintenanceOccurrenceAction,
  postponeMaintenanceOccurrenceAction,
  type MaintenanceOccurrenceActionResult,
} from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MaintenanceOccurrenceActionsProps = {
  occurrenceId: string;
  plannedDate: string;
};

const inputClassName =
  "h-9 rounded-xl border-slate-300 px-3 text-sm text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-100";

export function MaintenanceOccurrenceActions({
  occurrenceId,
  plannedDate,
}: MaintenanceOccurrenceActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"complete" | "postpone" | "cancel" | null>(
    null
  );
  const [result, setResult] = useState<MaintenanceOccurrenceActionResult | null>(
    null
  );

  function submitAction(
    formData: FormData,
    action: (formData: FormData) => Promise<MaintenanceOccurrenceActionResult>
  ) {
    formData.set("occurrenceId", occurrenceId);
    setResult(null);

    startTransition(async () => {
      const nextResult = await action(formData);
      setResult(nextResult);
      if (nextResult.ok) {
        setMode(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
          disabled={isPending}
          onClick={() => setMode(mode === "complete" ? null : "complete")}
        >
          Compléter
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
          disabled={isPending}
          onClick={() => setMode(mode === "postpone" ? null : "postpone")}
        >
          Reporter
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-xl border-red-200 bg-white px-3 text-xs font-bold text-red-700"
          disabled={isPending}
          onClick={() => setMode(mode === "cancel" ? null : "cancel")}
        >
          Annuler
        </Button>
      </div>

      {mode === "complete" ? (
        <form
          className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
          action={(formData) =>
            submitAction(formData, completeMaintenanceOccurrenceAction)
          }
        >
          <Input
            name="cost"
            placeholder="Coût réel"
            className={inputClassName}
            disabled={isPending}
          />
          <Textarea
            name="note"
            placeholder="Note"
            className="min-h-20 rounded-xl border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-100"
            disabled={isPending}
          />
          <Button
            type="submit"
            className="h-8 rounded-xl bg-teal-600 px-3 text-xs font-bold text-white hover:bg-teal-700"
            disabled={isPending}
          >
            Confirmer
          </Button>
        </form>
      ) : null}

      {mode === "postpone" ? (
        <form
          className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
          action={(formData) =>
            submitAction(formData, postponeMaintenanceOccurrenceAction)
          }
        >
          <Input
            name="plannedDate"
            type="date"
            defaultValue={plannedDate}
            className={inputClassName}
            disabled={isPending}
          />
          <Textarea
            name="note"
            placeholder="Note de report"
            className="min-h-20 rounded-xl border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-100"
            disabled={isPending}
          />
          <Button
            type="submit"
            className="h-8 rounded-xl bg-teal-600 px-3 text-xs font-bold text-white hover:bg-teal-700"
            disabled={isPending}
          >
            Reporter
          </Button>
        </form>
      ) : null}

      {mode === "cancel" ? (
        <form
          className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-3"
          action={(formData) =>
            submitAction(formData, cancelMaintenanceOccurrenceAction)
          }
        >
          <Textarea
            name="note"
            placeholder="Motif d’annulation"
            className="min-h-20 rounded-xl border-red-200 px-3 py-2 text-sm text-slate-950 shadow-none focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-100"
            disabled={isPending}
          />
          <Button
            type="submit"
            className="h-8 rounded-xl bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
            disabled={isPending}
          >
            Confirmer l’annulation
          </Button>
        </form>
      ) : null}

      {result ? (
        <p
          className={
            result.ok
              ? "text-xs font-bold text-teal-700"
              : "text-xs font-bold text-red-700"
          }
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
