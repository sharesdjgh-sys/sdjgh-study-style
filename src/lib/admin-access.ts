/** Server-only configuration. Never import this module into a Client Component. */
export function isAdminAccount(id: string | undefined) {
  if (!id) return false;
  return (process.env.ADMIN_ACCOUNT_IDS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) =>
      /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value),
    )
    .includes(id.toLowerCase());
}
