"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetDatabaseData } from "@/app/(app)/settings/actions";
import type { ResetDatabaseResult } from "@/app/(app)/settings/actions";
import { ImportUnitsDialog } from "@/components/settings/import-units-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ResetDatabaseCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<ResetDatabaseResult | null>(null);
  const isValid = confirmText === "RESET";

  function handleReset() {
    if (!isValid || isPending) return;
    startTransition(async () => {
      const res = await resetDatabaseData();
      setResult(res);
      if (res.ok) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-950">
            Gestion de la base de données
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Outils administratifs pour gérer les données de test de
            l&apos;application.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Importation des unités
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Importer les unités, copropriétaires et informations disponibles
              à partir du fichier Excel officiel de CoproPilot.
            </p>
            <ImportUnitsDialog />
          </div>

          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-base font-bold text-slate-800">
              Réinitialisation des données
            </h3>
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                Cette action supprimera les données de test et permettra
                de repartir à zéro. Cette opération est irréversible.
              </p>
            </div>
            <Button
              type="button"
              className="mt-4 h-10 rounded-xl bg-red-600 px-4 text-white hover:bg-red-700"
              onClick={() => {
                setResult(null);
                setConfirmText("");
                setOpen(true);
              }}
            >
              Réinitialiser les données
            </Button>
          </div>

          {result && !open ? (
            <p
              className={
                result.ok
                  ? "rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
                  : "rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              }
            >
              {result.message}
            </p>
          ) : null}
        </div>
      </section>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isPending) {
            setOpen(nextOpen);
            if (!nextOpen) {
              setConfirmText("");
            }
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-lg"
        >
          <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-red-600">
                  Réinitialisation
                </p>
                <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                  Confirmer la réinitialisation
                </DialogTitle>
                <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                  Cette action supprimera les données de test de la base de
                  données. Cette opération est irréversible.
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-5 py-6 sm:px-6">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Écrivez <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-bold text-slate-800">RESET</code> pour confirmer
              </span>
              <Input
                type="text"
                placeholder="RESET"
                className="h-12 rounded-xl border-slate-300 px-4 text-base font-mono text-slate-950 shadow-none focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-100"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isPending}
              />
            </label>

            {result && !result.ok ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {result.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white px-5 text-base font-bold text-slate-700"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-red-600 px-5 text-base font-bold text-white shadow-sm hover:bg-red-700"
              disabled={!isValid || isPending}
              onClick={handleReset}
            >
              {isPending
                ? "Réinitialisation..."
                : "Confirmer la réinitialisation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
