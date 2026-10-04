import { account, json, loginConfigured } from "@/lib/collection-server";
import { timedAuth } from "@/lib/auth-server";
import type { AuthSession } from "@/lib/auth-contract";

export const runtime = "nodejs";
export async function GET() {
  try {
    const owner = await timedAuth("session_db", () => account());
    return json({
      signedIn: Boolean(owner),
      configured: loginConfigured(),
      ...(owner ? { accountId: owner.id } : {}),
    } satisfies AuthSession);
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
