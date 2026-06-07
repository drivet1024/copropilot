"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  UserMinus,
} from "lucide-react";

import {
  createBoardAction,
  createBoardMemberAction,
  deleteBoardMemberAction,
  endBoardAction,
  updateBoardMemberAction,
  type BoardActionResult,
} from "@/app/(app)/condos/board/actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  condoBoardRoleLabels,
  condoBoardRoleOrder,
} from "@/lib/board/roles";
import type {
  BoardMemberRow,
  BoardUnitOption,
  BoardWithMembers,
} from "@/lib/data/board";

// ---- Helpers ----

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getUnitOptionLabel(unit: BoardUnitOption) {
  return unit.ownerName
    ? `Unité ${unit.unitNumber} - ${unit.ownerName}`
    : `Unité ${unit.unitNumber}`;
}

// ---- StatusBadge ----

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE" || status === "Actif";
  const className = isActive
    ? "bg-teal-50 text-teal-700"
    : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${className}`}
    >
      {isActive ? "Actif" : "Terminé"}
    </span>
  );
}

function getFieldError(
  result: BoardActionResult | null,
  fieldName: string
) {
  return result?.fieldErrors?.[fieldName]?.[0] ?? null;
}

function FieldError({
  fieldName,
  result,
}: {
  fieldName: string;
  result: BoardActionResult | null;
}) {
  const message = getFieldError(result, fieldName);
  return message ? (
    <span className="text-xs font-semibold text-red-600">{message}</span>
  ) : null;
}

const fieldClassName =
  "h-12 rounded-xl border-slate-300 px-4 text-base text-slate-950 shadow-none focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100";

const selectClassName =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

// ---- Modal Create Board ----

function CreateBoardDialog({
  trigger,
  onSuccess,
}: {
  trigger: React.ReactNode;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<BoardActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextResult = await createBoardAction(formData);
      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
        setResult(null);
        router.refresh();
        onSuccess();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
          if (nextOpen) setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-lg"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                Conseil d&apos;administration
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                Ajouter un conseil
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                Créez une nouvelle période de gouvernance.
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-6 sm:px-6">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nom du conseil <span className="text-slate-400">(optionnel)</span>
              </span>
              <Input
                name="name"
                placeholder="Conseil 2026-2027"
                className={fieldClassName}
              />
              <FieldError fieldName="name" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de début
              </span>
              <Input
                name="startDate"
                type="date"
                required
                defaultValue={getTodayInputValue()}
                className={fieldClassName}
              />
              <FieldError fieldName="startDate" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de fin <span className="text-slate-400">(optionnelle)</span>
              </span>
              <Input
                name="endDate"
                type="date"
                className={fieldClassName}
              />
              <FieldError fieldName="endDate" result={result} />
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
              type="submit"
              className="h-11 rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm hover:bg-teal-700"
              disabled={isPending}
            >
              {isPending ? "Création..." : "Créer le conseil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Modal Create/Edit Board Member ----

function BoardMemberDialog({
  boardId,
  mode,
  member,
  trigger,
  units,
  onSuccess,
}: {
  boardId: string;
  mode: "create" | "edit";
  member?: BoardMemberRow;
  trigger: React.ReactNode;
  units: BoardUnitOption[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<BoardActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedUnitId, setSelectedUnitId] = useState(member?.unitId ?? "");
  const [personName, setPersonName] = useState(member?.personName ?? "");
  const [personTouched, setPersonTouched] = useState(Boolean(member));

  function resetState() {
    setResult(null);
    setSelectedUnitId(member?.unitId ?? "");
    setPersonName(member?.personName ?? "");
    setPersonTouched(Boolean(member));
  }

  function handleUnitChange(unitId: string) {
    const selectedUnit = units.find((u) => u.id === unitId);
    setSelectedUnitId(unitId);
    if (selectedUnit?.ownerName && (!personTouched || !personName.trim())) {
      setPersonName(selectedUnit.ownerName);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("boardId", boardId);

    startTransition(async () => {
      const nextResult = isEdit && member
        ? await updateBoardMemberAction(member.id, formData)
        : await createBoardMemberAction(formData);

      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
        resetState();
        router.refresh();
        onSuccess();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
          if (nextOpen) resetState();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-3xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                Membre du conseil
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                {isEdit ? "Modifier un membre" : "Ajouter un membre"}
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                Ajoutez ou modifiez un membre du conseil d&apos;administration.
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

        <form onSubmit={handleSubmit}>
          <div className="grid max-h-[calc(92vh-185px)] gap-x-4 gap-y-4 overflow-y-auto px-5 py-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Rôle</span>
              <select
                name="role"
                required
                defaultValue={member?.role ?? "DIRECTOR"}
                className={selectClassName}
              >
                {condoBoardRoleOrder.map((role) => (
                  <option key={role} value={role}>
                    {condoBoardRoleLabels[role]}
                  </option>
                ))}
              </select>
              <FieldError fieldName="role" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Unité
              </span>
              <select
                name="unitId"
                value={selectedUnitId}
                onChange={(event) => handleUnitChange(event.target.value)}
                className={selectClassName}
              >
                <option value="">Aucune unité liée</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {getUnitOptionLabel(unit)}
                  </option>
                ))}
              </select>
              <FieldError fieldName="unitId" result={result} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Nom de la personne
              </span>
              <Input
                name="personName"
                required
                value={personName}
                onChange={(event) => {
                  setPersonName(event.target.value);
                  setPersonTouched(true);
                }}
                placeholder="Marie Tremblay"
                className={fieldClassName}
              />
              <FieldError fieldName="personName" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date d&apos;entrée
              </span>
              <Input
                name="startDate"
                type="date"
                defaultValue={member?.startDate ?? getTodayInputValue()}
                className={fieldClassName}
              />
              <FieldError fieldName="startDate" result={result} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de sortie <span className="text-slate-400">(optionnelle)</span>
              </span>
              <Input
                name="endDate"
                type="date"
                defaultValue={member?.endDate ?? ""}
                className={fieldClassName}
              />
              <FieldError fieldName="endDate" result={result} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Notes
              </span>
              <Textarea
                name="notes"
                rows={3}
                defaultValue={member?.notes ?? ""}
                className="rounded-xl border-slate-300 px-4 py-3 text-base text-slate-950 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100"
              />
              <FieldError fieldName="notes" result={result} />
            </label>

            {result && !result.ok ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
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
              type="submit"
              className="h-11 rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm hover:bg-teal-700"
              disabled={isPending}
            >
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Modal End Board ----

function EndBoardDialog({
  board,
  trigger,
  onSuccess,
}: {
  board: BoardWithMembers;
  trigger: React.ReactNode;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<BoardActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("boardId", board.id);

    startTransition(async () => {
      const nextResult = await endBoardAction(formData);
      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
        setResult(null);
        router.refresh();
        onSuccess();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
          if (nextOpen) setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl sm:max-w-lg"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-6 sm:px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
                Terminer un conseil
              </p>
              <DialogTitle className="mt-3 text-2xl font-bold text-slate-950">
                Terminer {board.name}
              </DialogTitle>
              <DialogDescription className="mt-3 text-base leading-7 text-slate-500">
                Entrez la date de fin du conseil. Les membres actifs seront
                automatiquement terminés à la même date.
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-6 sm:px-6">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Date de fin
              </span>
              <Input
                name="endDate"
                type="date"
                required
                defaultValue={getTodayInputValue()}
                className={fieldClassName}
              />
              <FieldError fieldName="endDate" result={result} />
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
              type="submit"
              className="h-11 rounded-xl bg-amber-600 px-5 text-base font-bold text-white shadow-sm hover:bg-amber-700"
              disabled={isPending}
            >
              {isPending ? "Terminer..." : "Terminer le conseil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Bouton Terminer un membre ----

function EndBoardMemberButton({
  memberId,
  memberName,
  onSuccess,
}: {
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleEnd() {
    if (!confirm(`Terminer le mandat de ${memberName} ?`)) return;
    const today = new Date().toISOString().slice(0, 10);

    startTransition(async () => {
      const { endBoardMemberAction } = await import(
        "@/app/(app)/condos/board/actions"
      );
      const result = await endBoardMemberAction(memberId, today);
      if (result.ok) {
        router.refresh();
        onSuccess();
      } else {
        alert(result.message);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 whitespace-nowrap rounded-xl border-red-200 bg-white text-sm text-red-700 hover:bg-red-50"
      disabled={isPending}
      onClick={handleEnd}
    >
      <UserMinus className="size-3.5" aria-hidden="true" />
      Terminer
    </Button>
  );
}

function DeleteBoardMemberButton({
  memberId,
  memberName,
  onSuccess,
}: {
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Retirer ${memberName} de ce conseil ?`)) return;

    startTransition(async () => {
      const result = await deleteBoardMemberAction(memberId);
      if (result.ok) {
        router.refresh();
        onSuccess();
      } else {
        alert(result.message);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 whitespace-nowrap rounded-xl border-red-200 bg-white text-sm text-red-700 hover:bg-red-50"
      disabled={isPending}
      onClick={handleDelete}
    >
      <UserMinus className="size-3.5" aria-hidden="true" />
      Retirer
    </Button>
  );
}

// ---- Card d'un conseil (affichage compact) ----

function BoardCard({
  board,
  canManageBoard,
  units,
  defaultExpanded = false,
  onRefresh,
}: {
  board: BoardWithMembers;
  canManageBoard: boolean;
  units: BoardUnitOption[];
  defaultExpanded?: boolean;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isActive = board.status === "ACTIVE";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* En-tête */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-b border-slate-200 p-5 text-left hover:bg-slate-50"
      >
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h3 className="text-lg font-bold text-slate-950">{board.name}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              Début : {board.startDateDisplay}
            </span>
            {board.endDate ? (
              <span>Fin : {board.endDateDisplay}</span>
            ) : null}
            <StatusBadge status={board.status} />
            <span className="font-semibold text-slate-700">
              {board.members.length} membre{board.members.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="ml-3 size-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="ml-3 size-5 shrink-0 text-slate-400" />
        )}
      </button>

      {/* Contenu déplié */}
      {expanded ? (
        <div>
          {/* Barre d'actions */}
          {canManageBoard ? (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <BoardMemberDialog
                boardId={board.id}
                mode="create"
                trigger={
                  <Button
                    type="button"
                    className="h-9 rounded-xl bg-teal-600 px-3 text-sm text-white hover:bg-teal-700"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Ajouter un membre
                  </Button>
                }
                units={units}
                onSuccess={onRefresh}
              />
              {isActive ? (
                <EndBoardDialog
                  board={board}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 whitespace-nowrap rounded-xl border-amber-200 bg-white text-sm text-amber-700 hover:bg-amber-50"
                    >
                      Terminer le conseil
                    </Button>
                  }
                  onSuccess={onRefresh}
                />
              ) : null}
            </div>
          ) : null}

          {/* Tableau des membres */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  {[
                    "Rôle",
                    "Nom",
                    "Unité",
                    "Date d’entrée",
                    "Date de sortie",
                    "Statut",
                    ...(canManageBoard ? ["Actions"] : []),
                  ].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        6 + (canManageBoard ? 1 : 0)
                      }
                      className="px-4 py-8 text-center text-base font-semibold text-slate-500"
                    >
                      Aucun membre dans ce conseil.
                    </td>
                  </tr>
                ) : (
                  board.members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-100 align-middle hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-bold text-slate-950">
                        {member.roleLabel}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {member.personName}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {member.unitLabel}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {member.startDateDisplay}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {member.endDateDisplay}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={member.status} />
                      </td>
                      {canManageBoard ? (
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <BoardMemberDialog
                              boardId={board.id}
                              mode="edit"
                              member={member}
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 whitespace-nowrap rounded-xl border-slate-300 bg-white text-sm"
                                >
                                  <Pencil className="size-3.5" aria-hidden="true" />
                                  Modifier
                                </Button>
                              }
                              units={units}
                              onSuccess={onRefresh}
                            />
                            {isActive ? (
                              <EndBoardMemberButton
                                memberId={member.id}
                                memberName={member.personName}
                                onSuccess={onRefresh}
                              />
                            ) : null}
                            <DeleteBoardMemberButton
                              memberId={member.id}
                              memberName={member.personName}
                              onSuccess={onRefresh}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---- Historique des conseils ----

function HistoricalBoardsTable({
  canManageBoard,
  boards,
  onRefresh,
  units,
}: {
  canManageBoard: boolean;
  boards: BoardWithMembers[];
  onRefresh: () => void;
  units: BoardUnitOption[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">
          Historique des conseils
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Conseils d&apos;administration précédents.
        </p>
      </div>

      {boards.length === 0 ? (
        <div className="px-5 py-8 text-center text-base font-semibold text-slate-500">
          Aucun conseil terminé pour le moment.
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              canManageBoard={canManageBoard}
              units={units}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---- Section principale ----

type BoardsSectionProps = {
  canManageBoard: boolean;
  activeBoard: BoardWithMembers | null;
  historicalBoards: BoardWithMembers[];
  units: BoardUnitOption[];
};

export function BoardsSection({
  canManageBoard,
  activeBoard,
  historicalBoards,
  units,
}: BoardsSectionProps) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Conseil actuel */}
      <section className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Conseil actuel
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Conseil d&apos;administration en cours.
            </p>
          </div>
          {canManageBoard ? (
            <CreateBoardDialog
              trigger={
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Ajouter un conseil
                </Button>
              }
              onSuccess={refresh}
            />
          ) : null}
        </div>

        {activeBoard ? (
          <BoardCard
            board={activeBoard}
            canManageBoard={canManageBoard}
            units={units}
            defaultExpanded
            onRefresh={refresh}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base font-semibold text-slate-500">
            Aucun conseil actif. Créez un conseil pour commencer.
          </div>
        )}
      </section>

      <HistoricalBoardsTable
        boards={historicalBoards}
        canManageBoard={canManageBoard}
        units={units}
        onRefresh={refresh}
      />
    </div>
  );
}
