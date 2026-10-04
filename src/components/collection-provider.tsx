"use client";
import {
  createContext,
  Fragment,
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
import { isRecordRemoval, RECORDS_CLEARED } from "@/lib/storage";
import { useAuth } from "./auth-provider";
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
  const auth = useAuth();
  const owner = auth.session.signedIn ? auth.session.accountId : undefined;
  const [state, setState] = useState({
    data: EMPTY_COLLECTION,
    owner: "",
    loaded: false,
    error: false,
  });
  const [recordsVersion, setRecordsVersion] = useState(0);
  const serial = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refreshAuth = auth.refresh;
  const cancel = useCallback(() => {
    serial.current++;
    controller.current?.abort();
  }, []);
  const refresh = useCallback(async () => {
    if (!owner) {
      await refreshAuth();
      return;
    }
    const current = ++serial.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch("/api/collection", {
        cache: "no-store",
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
      });
      if (!response.ok) throw new Error("unavailable");
      const data: CollectionData = await response.json();
      if (current !== serial.current) return;
      if (!data.signedIn || data.accountId !== owner) {
        setState({ owner, data: EMPTY_COLLECTION, loaded: true, error: true });
        await refreshAuth();
        return;
      }
      setState({ owner, data, loaded: true, error: false });
    } catch {
      if (current === serial.current)
        setState((old) => ({
          data: old.owner === owner ? old.data : EMPTY_COLLECTION,
          owner,
          loaded: true,
          error: true,
        }));
    }
  }, [owner, refreshAuth]);
  useEffect(() => {
    if (!owner) return;
    const frame = requestAnimationFrame(() => void refresh());
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    const timer = setInterval(visible, 30000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      cancel();
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [owner, refresh, cancel]);
  useEffect(() => {
    const reset = () => {
      setRecordsVersion((version) => version + 1);
    };
    const removed = (event: StorageEvent) => {
      if (isRecordRemoval(event)) window.location.reload();
    };
    window.addEventListener(RECORDS_CLEARED, reset);
    window.addEventListener("storage", removed);
    return () => {
      window.removeEventListener(RECORDS_CLEARED, reset);
      window.removeEventListener("storage", removed);
    };
  }, []);
  const current = Boolean(owner && state.owner === owner);
  const data = {
    ...(current ? state.data : EMPTY_COLLECTION),
    configured: auth.session.configured,
    signedIn: Boolean(owner),
    accountId: owner,
  };
  const loaded = owner ? current && state.loaded : auth.status !== "checking";
  const error = auth.status === "error" || Boolean(current && state.error);
  return (
    <Context.Provider value={{ data, loaded, error, refresh }}>
      {recordsVersion > 0 && (
        <p className="notice" role="status">
          이 브라우저의 검사 기록을 지웠어요.
          {owner && " 계정에 저장된 검사 결과와 도감은 유지돼요."}
        </p>
      )}
      <Fragment key={recordsVersion}>{children}</Fragment>
    </Context.Provider>
  );
}
export const useCollection = () => useContext(Context);
