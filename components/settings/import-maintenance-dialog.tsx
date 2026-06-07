"use client";

import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, FileSpreadsheet, Upload } from "lucide-react";

import {
  analyzeMaintenanceImportExcel,
  confirmMaintenanceImport,
  type ImportMaintenanceResult,
} from "@/app/(app)/settings/actions";
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
import { Input } from "@/components/ui/input";

const fieldClassName =
  "h-10 rounded-xl border-slate-300 px-3 text-sm text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-100";

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ImportSummary({ result }: { result: ImportMaintenanceResult }) {
  const summary = result.summary;

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryValue label="Court terme" value={summary.shortTermTasks} />
        <SummaryValue label="Long terme" value={summary.longTermTasks} />
        <SummaryValue
          label="Occurrences"
          value={
            result.importPayload?.rows.reduce(
              (total, row) => total + row.occurrences.length,
              0
            ) ?? 0
          }
        />
        <SummaryValue label="Erreurs" value={summary.errors.length} />
        <SummaryValue label="Avertissements" value={summary.warnings.length} />
        <SummaryValue label="Tâches créées" value={summary.createdItems} />
        <SummaryValue label="Tâches ignorées" value={summary.duplicateItems} />
        <SummaryValue
          label="Occurrences créées"
          value={summary.createdOccurrences}
        />
        <SummaryValue
          label="Occurrences ignorées"
          value={summary.duplicateOccurrences}
        />
      </div>

      {summary.ignoredSheets.length > 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Onglets ignorés: {summary.ignoredSheets.join(", ")}.
        </p>
      ) : null}

      {summary.errors.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-800">Erreurs</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-red-800">
            {summary.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">Avertissements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-amber-800">
            {summary.warnings.slice(0, 12).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          {summary.warnings.length > 12 ? (
            <p className="mt-2 text-xs font-bold text-amber-800">
              {summary.warnings.length - 12} avertissement(s) de plus.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PreviewTable({ result }: { result: ImportMaintenanceResult }) {
  if (!result.previewRows || result.previewRows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            {[
              "Catégorie",
              "Élément",
              "Code composant",
              "Description",
              "Fréquence",
              "Mois",
              "Effectué par",
              "Payé par",
              "Type",
              "Occurrences",
            ].map((header) => (
              <th
                key={header}
                className="px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.previewRows.map((row) => (
            <tr key={`${row.elementCode}-${row.description}`} className="border-b border-slate-100">
              <td className="px-2 py-2 text-slate-600">{row.category}</td>
              <td className="px-2 py-2 font-bold text-slate-950">{row.elementCode}</td>
              <td className="px-2 py-2 text-slate-600">{row.componentCode}</td>
              <td className="max-w-[260px] px-2 py-2 font-semibold text-slate-700">
                {row.description}
              </td>
              <td className="px-2 py-2 text-slate-600">{row.frequency}</td>
              <td className="px-2 py-2 text-slate-600">{row.month}</td>
              <td className="px-2 py-2 text-slate-600">{row.performedBy}</td>
              <td className="px-2 py-2 text-slate-600">{row.paidBy}</td>
              <td className="px-2 py-2 font-bold text-teal-700">
                {row.maintenanceType}
              </td>
              <td className="px-2 py-2 text-slate-600">{row.occurrenceCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImportMaintenanceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ImportMaintenanceResult | null>(null);
  const [importResult, setImportResult] =
    useState<ImportMaintenanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayedResult = importResult ?? analysisResult;
  const isBusy = isAnalyzing || isImporting;
  const canImport = Boolean(
    analysisResult?.ok &&
      analysisResult.importPayload &&
      analysisResult.summary &&
      analysisResult.summary.errors.length === 0 &&
      !importResult?.ok
  );

  function resetState() {
    setAnalysisResult(null);
    setImportResult(null);
    setError(null);
  }

  function validateSelectedFile() {
    if (!selectedFile) {
      return "Veuillez sélectionner un fichier Excel.";
    }

    if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      return "Le fichier doit être au format .xlsx.";
    }

    return null;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    resetState();
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    resetState();

    const validationError = validateSelectedFile();

    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.set("file", selectedFile as File);
    setIsAnalyzing(true);

    try {
      const nextResult = await analyzeMaintenanceImportExcel(formData);
      setAnalysisResult(nextResult);
    } catch {
      setError("Une erreur est survenue pendant l’analyse du fichier.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleImport() {
    const payload = analysisResult?.importPayload;

    if (isBusy || !canImport || !payload) {
      return;
    }

    setError(null);
    setImportResult(null);
    setIsImporting(true);

    try {
      const nextResult = await confirmMaintenanceImport(payload);
      setImportResult(nextResult);

      if (nextResult.ok) {
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue pendant l’importation.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isBusy) {
          setOpen(nextOpen);
          if (nextOpen) {
            setSelectedFile(null);
            setFileInputKey((key) => key + 1);
            resetState();
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
        >
          <Upload className="size-4" aria-hidden="true" />
          Importer un carnet d’entretien
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[88vh] max-w-[calc(100%-1rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-6xl"
      >
        <DialogHeader className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
                Import Excel
              </p>
              <DialogTitle className="mt-2 text-xl font-bold text-slate-950">
                Importer un carnet d’entretien
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">
                Seuls les onglets “Entretien 5 ans -” et “Entretien 6 ans +”
                seront lus. FP+ et Scénario FP+ sont ignorés.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
              disabled={isBusy}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-col" onSubmit={handleAnalyze}>
          <div className="max-h-[calc(88vh-170px)] space-y-3 overflow-y-auto px-4 py-4 pb-14 sm:px-5">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <div className="flex gap-3">
                <FileSpreadsheet
                  className="mt-0.5 size-5 shrink-0 text-sky-700"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold leading-6 text-sky-800">
                  Les cellules vertes du calendrier créent des occurrences TODO.
                  Les tâches de l’onglet 6 ans + seront ajoutées comme tâches à
                  planifier, sans occurrence automatique.
                </p>
              </div>
            </div>

            <label className="block max-w-xl space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Fichier Excel .xlsx
              </span>
              <Input
                key={fileInputKey}
                name="file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={isBusy}
                className={fieldClassName}
                onChange={handleFileChange}
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            {displayedResult ? (
              <p
                className={
                  displayedResult.ok
                    ? "rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
                    : "rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                }
              >
                {displayedResult.message}
              </p>
            ) : null}

            {displayedResult ? <ImportSummary result={displayedResult} /> : null}
            {analysisResult?.ok && !importResult ? (
              <PreviewTable result={analysisResult} />
            ) : null}

            {importResult?.ok ? (
              <Link
                href="/maintenance"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
              >
                <CalendarCheck className="size-4" aria-hidden="true" />
                Voir le carnet d’entretien
              </Link>
            ) : null}
          </div>

          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-4 py-2 sm:flex-row sm:justify-end sm:px-5">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
              disabled={isBusy}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="h-9 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
              disabled={isBusy}
            >
              {isAnalyzing ? "Analyse..." : "Analyser le fichier"}
            </Button>
            <Button
              type="button"
              className="h-9 rounded-xl bg-teal-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              disabled={isBusy || !canImport}
              onClick={handleImport}
            >
              {isImporting ? "Importation..." : "Confirmer l’import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
