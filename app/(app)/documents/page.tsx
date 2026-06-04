import { getDocumentWhereForUser } from "@/lib/auth/tenant-access";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function DocumentsPage() {
  const user = await requireUser();
  const documentCount = await prisma.document.count({
    where: getDocumentWhereForUser(user),
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-950">Documents</h1>
      <p className="mt-3 text-lg leading-8 text-slate-600">
        Cette section sera connectée à PostgreSQL avec Prisma.
      </p>
      <p className="mt-5 text-base font-semibold text-teal-700">
        {documentCount} document{documentCount > 1 ? "s" : ""} accessible
        {documentCount > 1 ? "s" : ""} dans votre portée.
      </p>
    </div>
  );
}
