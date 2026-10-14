import { json } from "@/lib/collection-server";
import { adminRange } from "@/lib/admin-params";
import { adminFailure, adminStats, requireAdmin } from "@/lib/admin-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    return json(
      await adminStats(adminRange(new URL(request.url).searchParams)),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
