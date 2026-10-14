import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminError, requireAdmin } from "@/lib/admin-server";
export const metadata = {
  title: "관리자 통계",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  let initialAccess: "allowed" | "anonymous" | "forbidden" | "unavailable" =
    "allowed";
  try {
    await requireAdmin();
  } catch (error) {
    initialAccess =
      error instanceof AdminError
        ? error.status === 401
          ? "anonymous"
          : "forbidden"
        : "unavailable";
  }
  // Only a non-sensitive shell is rendered here. Every data request rechecks authority.
  return <AdminDashboard initialAccess={initialAccess} />;
}
