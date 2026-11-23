import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { account, AUTH_COOKIE } from "./collection-server";
import { identityHash } from "./auth-server";
import { isAdminAccount } from "./admin-access";

export const MANAGER_COOKIE = "sdj-prize-manager";
// Match the designated Kakao account without persisting a participant's email.
const managerEmailDigest =
  "949733a86d478a4a75bdbd8184dbc98c9c2b162fcd0405d13f7dea97c281f67d";

export function verifiedSdjManager(profile?: {
  email?: string;
  is_email_verified?: boolean;
  is_email_valid?: boolean;
}) {
  return (
    profile?.is_email_verified === true &&
    profile.is_email_valid === true &&
    typeof profile.email === "string" &&
    createHash("sha256")
      .update(profile.email.trim().toLowerCase())
      .digest("hex") === managerEmailDigest
  );
}

export function managerProof(token: string) {
  return identityHash("sdj-manager-session:" + token);
}

export async function canViewSdjPrizes(includeExistingAdmins = false) {
  const jar = await cookies();
  const session = jar.get(AUTH_COOKIE)?.value;
  if (!session) return false;
  const proof = jar.get(MANAGER_COOKIE)?.value;
  const matches = !!proof && proof === managerProof(session);
  if (!matches && !includeExistingAdmins) return false;
  const owner = await account();
  return (
    !!owner && (matches || (includeExistingAdmins && isAdminAccount(owner.id)))
  );
}
