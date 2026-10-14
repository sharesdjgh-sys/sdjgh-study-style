import { json } from "@/lib/collection-server";
import { accountFilters } from "@/lib/admin-params";
import { adminAccounts, adminFailure, requireAdmin } from "@/lib/admin-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    return json(
      await adminAccounts(accountFilters(new URL(request.url).searchParams)),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
