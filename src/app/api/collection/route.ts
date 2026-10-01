import { account, collectionData, json } from "@/lib/collection-server";
export const runtime = "nodejs";
export async function GET() {
  try {
    return json(await collectionData(await account()));
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
