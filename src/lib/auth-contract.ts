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
