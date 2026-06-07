import {
  condoBoardRoleDescriptions,
  condoBoardRoleLabels,
  condoBoardRoleOrder,
} from "@/lib/board/roles";

export function BoardRolesReference() {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm open:pb-7">
      <summary className="cursor-pointer text-xl font-bold text-slate-950">
        Rôles et responsabilités typiques
      </summary>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {condoBoardRoleOrder.map((role) => (
          <div key={role} className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-base font-bold text-slate-950">
              {condoBoardRoleLabels[role]}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {condoBoardRoleDescriptions[role]}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
