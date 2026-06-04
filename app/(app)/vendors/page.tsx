import { getVendorWhereForUser } from "@/lib/auth/tenant-access";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function VendorsPage() {
  const user = await requireUser();
  const vendorCount = await prisma.vendor.count({
    where: getVendorWhereForUser(user),
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-950">Fournisseurs</h1>
      <p className="mt-3 text-lg leading-8 text-slate-600">
        Cette section centralisera les fournisseurs et contacts de service.
      </p>
      <p className="mt-5 text-base font-semibold text-teal-700">
        {vendorCount} fournisseur{vendorCount > 1 ? "s" : ""} accessible
        {vendorCount > 1 ? "s" : ""} dans votre portée.
      </p>
    </div>
  );
}
