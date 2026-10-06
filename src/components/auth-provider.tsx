"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AUTH_CHANGED,
  type AuthSession,
  type AuthStatus,
} from "@/lib/auth-contract";

const anonymous: AuthSession = { signedIn: false, configured: false };
const Context = createContext({
  status: "checking" as AuthStatus,
  session: anonymous,
  message: "",
  busy: true,
  refresh: async () => {},
  login: async () => {},
  logout: async () => {},
  signedOut: () => {},
});
export function notifyAuthChange() {
  try {
    localStorage.setItem(AUTH_CHANGED, crypto.randomUUID());
  } catch {
    /* Visibility/pageshow revalidation works without storage too. */
  }
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    status: "checking" as AuthStatus,
    session: anonymous,
    message: "",
  });
  const [slow, setSlow] = useState(false);
  const serial = useRef(0);
  const action = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef<Promise<void> | null>(null);
  const invalidate = useCallback(() => {
    serial.current++;
    controller.current?.abort();
    pending.current = null;
  }, []);
  const refresh = useCallback(async (background = false) => {
    if (action.current) return;
    if (pending.current) return pending.current;
    const current = ++serial.current;
    const abort = new AbortController();
    controller.current = abort;
    setState((old) =>
      background &&
      (old.status === "authenticated" || old.status === "anonymous")
        ? old
        : { ...old, status: "checking", message: "" },
    );
    const work = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
        });
        if (!response.ok) throw new Error("session_unavailable");
        const session: AuthSession = await response.json();
        if (
          typeof session.signedIn !== "boolean" ||
          typeof session.configured !== "boolean" ||
          (session.signedIn && typeof session.accountId !== "string")
        )
          throw new Error("invalid_session");
        if (current !== serial.current) return;
        setState({
          status: session.signedIn ? "authenticated" : "anonymous",
          session,
          message: "",
        });
      } catch {
        if (current === serial.current)
          setState((old) =>
            // A failed background request does not establish a logout.
            // Explicit revalidation and account changes still fail closed.
            background &&
            (old.status === "authenticated" || old.status === "anonymous")
              ? old
              : {
                  status: "error",
                  session: { ...anonymous, configured: old.session.configured },
                  message:
                    "로그인 상태를 확인하지 못했어요. 다시 확인해 주세요.",
                },
          );
      } finally {
        if (current === serial.current) pending.current = null;
      }
    };
    pending.current = work();
    return pending.current;
  }, []);
  const signedOut = useCallback(() => {
    invalidate();
    action.current = false;
    setState((old) => ({
      status: "anonymous",
      session: { ...anonymous, configured: old.session.configured },
      message: "로그아웃했어요.",
    }));
    notifyAuthChange();
  }, [invalidate]);
  const login = useCallback(async () => {
    if (action.current) return;
    action.current = true;
    invalidate();
    const current = serial.current;
    setState((old) => ({
      ...old,
      status: "redirecting",
      message: "카카오 로그인 화면으로 이동하고 있어요…",
    }));
    try {
      const response = await fetch(
        `/api/auth/kakao/start?returnTo=${encodeURIComponent(location.pathname + location.search)}`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) throw new Error("login_unavailable");
      const payload = await response.json();
      const url = new URL(payload.authorizationUrl);
      if (
        url.origin !== "https://kauth.kakao.com" ||
        url.pathname !== "/oauth/authorize"
      )
        throw new Error("invalid_redirect");
      if (current === serial.current) window.location.assign(url.toString());
    } catch {
      if (current === serial.current) {
        action.current = false;
        setState((old) => ({
          ...old,
          status: "anonymous",
          message: "로그인을 시작하지 못했어요. 잠시 후 다시 눌러 주세요.",
        }));
      }
    }
  }, [invalidate]);
  const logout = useCallback(async () => {
    if (action.current) return;
    action.current = true;
    invalidate();
    const current = serial.current;
    setState((old) => ({
      ...old,
      status: "signing-out",
      message: "로그아웃하고 있어요…",
    }));
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("logout_failed");
      if (current === serial.current) signedOut();
    } catch {
      if (current === serial.current) {
        action.current = false;
        setState((old) => ({
          status: "error",
          session: { ...anonymous, configured: old.session.configured },
          message:
            "로그아웃 완료 여부를 확인하지 못했어요. 로그인 상태를 다시 확인해 주세요.",
        }));
      }
    }
  }, [invalidate, signedOut]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    const visible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      action.current = false;
      invalidate();
      void refresh();
    };
    const changed = (event: StorageEvent) => {
      if (event.key !== AUTH_CHANGED && event.key !== null) return;
      action.current = false;
      invalidate();
      setState((old) => ({
        ...old,
        status: "checking",
        session: { ...anonymous, configured: old.session.configured },
      }));
      void refresh();
    };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pageshow", restored);
    window.addEventListener("storage", changed);
    const timer = setInterval(visible, 30000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      invalidate();
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pageshow", restored);
      window.removeEventListener("storage", changed);
    };
  }, [invalidate, refresh]);
  const busy = ["checking", "redirecting", "signing-out"].includes(
    state.status,
  );
  useEffect(() => {
    const reset = requestAnimationFrame(() => setSlow(false));
    const timer = busy ? setTimeout(() => setSlow(true), 5000) : undefined;
    return () => {
      cancelAnimationFrame(reset);
      clearTimeout(timer);
    };
  }, [busy, state.status]);
  const message =
    slow && busy
      ? "연결이 평소보다 오래 걸리고 있어요. 잠시만 기다려 주세요."
      : state.status === "checking"
        ? "로그인 상태 확인 중…"
        : state.message;
  return (
    <Context.Provider
      value={{ ...state, message, busy, refresh, login, logout, signedOut }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
