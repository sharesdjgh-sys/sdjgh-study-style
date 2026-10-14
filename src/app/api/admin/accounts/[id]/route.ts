import { json } from "@/lib/collection-server";
import { adminDetail, adminFailure, requireAdmin } from "@/lib/admin-server";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    return json(await adminDetail((await context.params).id));
  } catch (error) {
    return adminFailure(error);
  }
}
