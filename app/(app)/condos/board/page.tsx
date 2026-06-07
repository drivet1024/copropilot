import { redirect } from "next/navigation";

import { BoardRolesReference } from "@/components/condos/board-roles-reference";
import { BoardsSection } from "@/components/condos/boards-section";
import { CondoSectionHeader } from "@/components/condos/condo-section-header";
import { NoCondoConfiguredState } from "@/components/condos/no-condo-configured-state";
import { requireUser } from "@/lib/auth/session";
import { getBoardsForCurrentCondo } from "@/lib/data/board";

export default async function CondoBoardPage() {
  const user = await requireUser();

  if (user.role === "OWNER") {
    redirect("/dashboard");
  }

  const boardData = await getBoardsForCurrentCondo(user);

  if (!boardData) {
    return <NoCondoConfiguredState activeHref="/condos/board" />;
  }

  const canManageBoard =
    user.role === "MASTER_USER" || user.role === "CONDO_MANAGER";

  return (
    <div className="space-y-8">
      <CondoSectionHeader
        title="Conseil d’administration"
        subtitle="Gérez les conseils et leurs membres."
        activeHref="/condos/board"
      />

      <BoardsSection
        canManageBoard={canManageBoard}
        activeBoard={boardData.activeBoard}
        historicalBoards={boardData.historicalBoards}
        units={boardData.units}
      />

      <BoardRolesReference />
    </div>
  );
}
