"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setCondoFeePaymentMonthPaidAction } from "@/app/(app)/condos/payments/actions";
import { cn } from "@/lib/utils";

type MonthlyPaymentCheckboxProps = {
  checked: boolean;
  className?: string;
  label: string;
  periodStart: string;
  readOnly?: boolean;
  unitId: string;
};

export function MonthlyPaymentCheckbox({
  checked,
  className,
  label,
  periodStart,
  readOnly = false,
  unitId,
}: MonthlyPaymentCheckboxProps) {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(checked);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextChecked: boolean) {
    setIsChecked(nextChecked);
    setMessage(null);

    startTransition(async () => {
      const result = await setCondoFeePaymentMonthPaidAction({
        isPaid: nextChecked,
        periodStart,
        unitId,
      });

      if (!result.ok) {
        setIsChecked(!nextChecked);
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={isChecked}
          disabled={readOnly || isPending}
          onChange={(event) => handleChange(event.target.checked)}
          className="size-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <span>{label}</span>
      </label>
      {message ? (
        <p className="text-xs font-semibold text-red-600">{message}</p>
      ) : null}
    </div>
  );
}
