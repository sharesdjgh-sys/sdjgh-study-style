"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_GOODS, type GoodsProgress } from "@/lib/goods";
import { useCollection } from "./collection-provider";
const Context = createContext({
  progress: EMPTY_GOODS,
  loaded: false,
  error: false,
  signedIn: false,
  refresh: async () => {},
  redeem: async (id: string): Promise<string> => {
    void id;
    throw Error("unauthorized");
  },
});
export function GoodsProvider({ children }: { children: ReactNode }) {
  const { data } = useCollection();
  const owner = data.signedIn ? data.accountId : undefined;
  const current = useRef(owner);
  const serial = useRef(0);
  useEffect(() => {
    current.current = owner;
  }, [owner]);
  const [state, setState] = useState<{
    owner?: string;
    progress: GoodsProgress;
    loaded: boolean;
    error: boolean;
  }>({ progress: EMPTY_GOODS, loaded: false, error: false });
  const refresh = useCallback(async () => {
    if (!owner) return;
    const request = ++serial.current;
    try {
      const response = await fetch("/api/goods", {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!response.ok || result.accountId !== owner)
        throw Error("unavailable");
      if (current.current === owner && request === serial.current)
        setState({
          owner,
          progress: result.progress,
          loaded: true,
          error: false,
        });
    } catch {
      if (current.current === owner && request === serial.current)
        setState((old) => ({
          owner,
          progress: old.owner === owner ? old.progress : EMPTY_GOODS,
          loaded: true,
          error: true,
        }));
    }
  }, [owner]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", visible);
    window.addEventListener("study:stars", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("focus", visible);
      window.removeEventListener("study:stars", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh, data.cards]);
  const redeem = useCallback(
    async (id: string) => {
      if (!owner) throw Error("unauthorized");
      ++serial.current;
      try {
        const response = await fetch("/api/goods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
          signal: AbortSignal.timeout(15000),
        });
        const result = await response.json();
        if (current.current !== owner) throw Error("unauthorized");
        if (!response.ok) throw Error(result.error ?? "unavailable");
        if (result.accountId !== owner) throw Error("unauthorized");
        ++serial.current;
        setState({
          owner,
          progress: result.progress,
          loaded: true,
          error: false,
        });
        return String(result.outcome);
      } catch (e) {
        void refresh();
        throw e;
      }
    },
    [owner, refresh],
  );
  const valid = !!owner && state.owner === owner;
  return (
    <Context.Provider
      value={{
        progress: valid ? state.progress : EMPTY_GOODS,
        loaded: !owner || (valid && state.loaded),
        error: valid && state.error,
        signedIn: !!owner,
        refresh,
        redeem,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useGoods = () => useContext(Context);
