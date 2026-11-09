export type AuthSession = {
  signedIn: boolean;
  configured: boolean;
  accountId?: string;
  isAdmin?: boolean;
};
export type AuthStatus =
  | "checking"
  | "anonymous"
  | "redirecting"
  | "authenticated"
  | "signing-out"
  | "error";
export const AUTH_CHANGED = "study-style:auth-changed";
export function authReturnPath(path: string) {
  if (path === "/admin") return path;
  if (/^\/events\/sdj(?:\?[a-zA-Z0-9=&%-]*)?$/.test(path) && path.length < 300)
    return path;
  return path.length < 300 &&
    /^\/(?:methods(?:\/[a-z-]+)?|goods)(?:\?[a-zA-Z0-9=&%-]*)?$/.test(path)
    ? path
    : "/collection";
}
