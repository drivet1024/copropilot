"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteCondoFeePaymentAction,
  type CondoFeePaymentActionResult,
} from "@/app/(app)/condos/payments/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeletePaymentDialogProps = {
  paymentId: string;
  trigger: ReactNode;
  unitNumber: string;
};

export function DeletePaymentDialog({
  paymentId,
  trigger,
  unitNumber,
}: DeletePaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CondoFeePaymentActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const nextResult = await deleteCondoFeePaymentAction(paymentId);

      setResult(nextResult);

      if (nextResult.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
        }

        if (nextOpen) {
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-2xl font-bold text-slate-950">
            Effacer le paiement - Unité {unitNumber}
          </DialogTitle>
          <DialogDescription className="text-base leading-7 text-slate-500">
            Voulez-vous vraiment effacer ce paiement?
          </DialogDescription>
        </DialogHeader>

        {result && !result.ok ? (
          <p className="mx-6 mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {result.message}
          </p>
        ) : null}

        <DialogFooter className="mx-0 mb-0 rounded-b-2xl px-6 py-5">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10 rounded-xl px-4"
            disabled={isPending}
            onClick={handleDelete}
          >
            Effacer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
