import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();

  // TODO: Add server-side permission checks per dashboard widget when the
  // owner portal connects to real condo/unit data.
  return user.role === "OWNER" ? (
    <OwnerDashboard user={user} />
  ) : (
    <AdminDashboard />
  );
}
