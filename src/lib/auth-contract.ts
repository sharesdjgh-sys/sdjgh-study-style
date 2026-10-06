export type AuthSession = {
  signedIn: boolean;
  configured: boolean;
  accountId?: string;
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
  return path.length < 300 &&
    /^\/(?:methods(?:\/[a-z-]+)?|goods)(?:\?[a-zA-Z0-9=&%-]*)?$/.test(path)
    ? path
    : "/collection";
}
