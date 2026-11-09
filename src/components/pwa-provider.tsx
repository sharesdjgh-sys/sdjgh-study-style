"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const initialEnv = {
  mobile: false,
  standalone: false,
  ios: false,
  kakao: false,
  ready: false,
};
type Outcome = "accepted" | "dismissed" | "unavailable" | "failed";
const Context = createContext({
  env: initialEnv,
  canInstall: false,
  installed: false,
  installing: false,
  install: async (): Promise<Outcome> => "unavailable",
  open: false,
  show: () => {},
  hide: () => {},
});

// Capture once at the root, including before a student visits the install UI.
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const pending = useRef<InstallPrompt | null>(null);
  const lock = useRef(false);
  const [env, setEnv] = useState(initialEnv);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const check = () => {
      const ios =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setEnv({
        ios,
        mobile: ios || /Android/i.test(navigator.userAgent),
        kakao: /KAKAOTALK/i.test(navigator.userAgent),
        standalone:
          query.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
        ready: true,
      });
    };
    const available = (event: Event) => {
      event.preventDefault();
      pending.current = event as InstallPrompt;
      setCanInstall(true);
    };
    const complete = () => {
      pending.current = null;
      setCanInstall(false);
      setInstalled(true);
      check();
    };
    const frame = requestAnimationFrame(check);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    query.addEventListener("change", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
      query.removeEventListener("change", check);
    };
  }, []);
  async function install(): Promise<Outcome> {
    if (
      lock.current ||
      !pending.current ||
      env.kakao ||
      env.standalone ||
      installed
    )
      return "unavailable";
    const event = pending.current;
    pending.current = null;
    lock.current = true;
    setCanInstall(false);
    setInstalling(true);
    try {
      await event.prompt();
      return (await event.userChoice).outcome;
    } catch {
      return "failed";
    } finally {
      lock.current = false;
      setInstalling(false);
    }
  }
  return (
    <Context.Provider
      value={{
        env,
        canInstall,
        installed,
        installing,
        install,
        open,
        show,
        hide,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePwa = () => useContext(Context);
