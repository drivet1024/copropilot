"use client";

import { CalendarCheck } from "lucide-react";

import { ImportMaintenanceDialog } from "@/components/settings/import-maintenance-dialog";
import { ImportUnitsDialog } from "@/components/settings/import-units-dialog";

export function SettingsImportDataSection() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">
          Importation des données
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Importez les fichiers Excel utiles à la configuration et au suivi de
          la copropriété.
        </p>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-950">
                Carnet d’entretien
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Importez un fichier Excel de plan d’entretien pour créer les
                tâches et les occurrences du carnet d’entretien.
              </p>
              <div className="mt-4">
                <ImportMaintenanceDialog />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-bold text-slate-950">
            Importation des unités
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Importer les unités, copropriétaires et informations disponibles à
            partir du fichier Excel officiel de CoproPilot.
          </p>
          <div className="mt-4">
            <ImportUnitsDialog />
          </div>
        </div>
      </div>
    </section>
  );
}
