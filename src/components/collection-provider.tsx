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
  EMPTY_COLLECTION,
  type CollectionData,
} from "@/lib/collection-contract";
const Context = createContext({
  data: EMPTY_COLLECTION,
  loaded: false,
  error: false,
  refresh: async () => {},
});
export function CollectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<CollectionData>(EMPTY_COLLECTION);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const serial = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++serial.current;
    try {
      const response = await fetch("/api/collection", {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("unavailable");
      const next = await response.json();
      if (current !== serial.current) return;
      setData(next);
      setError(false);
    } catch {
      if (current === serial.current) setError(true);
    } finally {
      if (current === serial.current) setLoaded(true);
    }
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  useEffect(() => {
    if (!data.signedIn) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, [data.signedIn, refresh]);
  return (
    <Context.Provider value={{ data, loaded, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useCollection = () => useContext(Context);
