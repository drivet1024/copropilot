"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload } from "lucide-react";

import {
  analyzeUnitsImportExcel,
  confirmUnitsImport,
  type ImportUnitsResult,
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

type ExistingUnitMode = "update" | "ignore";

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

function ImportSummary({ result }: { result: ImportUnitsResult }) {
  const summary = result.summary;

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryValue label="Lignes détectées" value={summary.totalRowsDetected} />
        <SummaryValue label="Unités valides" value={summary.validUnits} />
        <SummaryValue label="Lignes ignorées" value={summary.ignoredRows} />
        <SummaryValue label="Doublons détectés" value={summary.duplicateUnits} />
        <SummaryValue label="Déjà existantes" value={summary.existingUnits} />
        <SummaryValue label="À créer" value={summary.newUnits} />
        <SummaryValue label="À mettre à jour" value={summary.unitsToUpdate} />
        <SummaryValue label="Unités créées" value={summary.createdUnits} />
        <SummaryValue label="Unités mises à jour" value={summary.updatedUnits} />
        <SummaryValue
          label="Existantes ignorées"
          value={summary.ignoredExistingUnits}
        />
        <SummaryValue label="Erreurs" value={summary.errors.length} />
      </div>

      {summary.errors.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-800">Erreurs</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-red-800">
            {summary.errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">Avertissements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-amber-800">
            {summary.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PreviewTable({ result }: { result: ImportUnitsResult }) {
  if (!result.previewRows || result.previewRows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            {[
              "Action",
              "Unité",
              "Propriétaire",
              "Quote-part unité",
              "Stationnements",
              "Quote-part stationnement",
              "Quote-part totale",
              "Courriel",
              "Téléphone",
              "Téléphone 2",
              "Location",
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
            <tr key={`${row.unitNumber}-${row.action}`} className="border-b border-slate-100">
              <td className="px-2 py-2 font-bold text-teal-700">{row.action}</td>
              <td className="px-2 py-2 font-bold text-slate-950">
                {row.unitNumber}
              </td>
              <td className="px-2 py-2 font-semibold text-slate-700">
                {row.ownerName || "Non défini"}
              </td>
              <td className="px-2 py-2 text-slate-600">{row.sharePercentage}</td>
              <td className="px-2 py-2 text-slate-600">{row.parkingCount}</td>
              <td className="px-2 py-2 text-slate-600">{row.parkingQuotePart}</td>
              <td className="px-2 py-2 text-slate-600">{row.quotePartTotal}</td>
              <td className="px-2 py-2 text-slate-600">
                {row.email || "Non défini"}
              </td>
              <td className="px-2 py-2 text-slate-600">
                {row.phone || "Non défini"}
              </td>
              <td className="px-2 py-2 text-slate-600">
                {row.mobile || "Non défini"}
              </td>
              <td className="px-2 py-2 text-slate-600">
                {row.location || "Non défini"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImportUnitsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingUnitMode, setExistingUnitMode] =
    useState<ExistingUnitMode>("update");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ImportUnitsResult | null>(null);
  const [importResult, setImportResult] = useState<ImportUnitsResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const displayedResult = importResult ?? analysisResult;
  const isBusy = isAnalyzing || isImporting;
  const canImport = Boolean(
    analysisResult?.ok &&
      analysisResult.importPayload &&
      analysisResult.summary?.validUnits &&
      !importResult?.ok
  );

  function resetState() {
    setAnalysisResult(null);
    setImportResult(null);
    setError(null);
  }

  function buildAnalysisFormData() {
    const formData = new FormData();

    if (selectedFile) {
      formData.set("file", selectedFile);
    }

    formData.set("existingUnitBehavior", existingUnitMode);

    return formData;
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

  function handleExistingUnitModeChange(event: ChangeEvent<HTMLSelectElement>) {
    setExistingUnitMode(event.target.value as ExistingUnitMode);
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

    setIsAnalyzing(true);

    try {
      const nextResult = await analyzeUnitsImportExcel(buildAnalysisFormData());
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
      const nextResult = await confirmUnitsImport(payload);
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
            setExistingUnitMode("update");
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
          Importer les unités
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[88vh] max-w-[calc(100%-1rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-5xl"
      >
        <DialogHeader className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
                Import Excel
              </p>
              <DialogTitle className="mt-2 text-xl font-bold text-slate-950">
                Importer les unités
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">
                Seul l’onglet “Import CoproPilot” sera lu.
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
                <div className="space-y-2 text-sm font-semibold leading-6 text-sky-800">
                  <p>
                    Les colonnes non supportées seront ignorées et aucun champ
                    non supporté ne sera ajouté automatiquement à la base de
                    données.
                  </p>
                  <p>
                    Les unités existantes seront traitées selon l’option choisie
                    ci-dessous. Si le fichier contient des doublons, seule la
                    dernière ligne de chaque unité sera conservée.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
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

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Si l’unité existe déjà
                </span>
                <select
                  name="existingUnitBehavior"
                  value={existingUnitMode}
                  disabled={isBusy}
                  onChange={handleExistingUnitModeChange}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                >
                  <option value="update">Mettre à jour l’unité existante</option>
                  <option value="ignore">Ignorer l’unité existante</option>
                </select>
              </label>
            </div>

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

            {analysisResult ? (
              <div className="sticky bottom-0 z-20 -mx-1 mt-1 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
                    disabled={isBusy}
                  >
                    {isAnalyzing ? "Analyse..." : "Réanalyser"}
                  </Button>
                  <Button
                    type="button"
                    className="h-9 rounded-xl bg-teal-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                    disabled={isBusy || !canImport}
                    onClick={handleImport}
                  >
                    {isImporting ? "Importation..." : "Importer"}
                  </Button>
                </div>
              </div>
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
              {isImporting ? "Importation..." : "Importer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
