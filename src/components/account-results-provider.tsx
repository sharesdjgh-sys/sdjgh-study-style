"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  parseSession,
  readFirstSession,
  readSession,
  type Session,
} from "@/lib/storage";
import { useCollection } from "./collection-provider";

const Context = createContext({
  results: [] as Session[],
  loaded: true,
  error: "",
  saving: false,
  refresh: () => {},
});
export function AccountResultsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useCollection();
  const path = usePathname();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    owner: "",
    results: [] as Session[],
    loaded: false,
    error: "",
    saving: false,
  });
  const owner = data.signedIn ? (data.accountId ?? "signed-in") : "";
  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    let active = true;
    async function synchronize() {
      if (!active) return;
      setState((old) => ({
        ...old,
        results: old.owner === owner ? old.results : [],
        owner,
        loaded: false,
        saving: true,
        error: "",
      }));
      let results: Session[] = [];
      try {
        const fetchResults = async () => {
          const response = await fetch("/api/results", {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(
              "계정 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
            );
          const payload = await response.json();
          return (payload.results as unknown[])
            .map((item) => parseSession(JSON.stringify(item), Date.now(), true))
            .filter((item): item is Session => Boolean(item?.result));
        };
        results = await fetchResults();
        const local = [readFirstSession(), readSession()];
        const seen = new Set(results.map((r) => r.runId));
        let changed = false;
        for (const session of local) {
          if (!session?.result || seen.has(session.runId)) continue;
          seen.add(session.runId);
          const response = await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(session),
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(
              response.status === 409
                ? "이 기기의 결과는 다른 계정에 저장됐거나 기존 기록과 달라요. 본인 계정인지 확인해 주세요."
                : "검사 결과를 계정에 저장하지 못했어요. 아래 버튼으로 다시 시도해 주세요.",
            );
          changed = true;
        }
        if (changed) results = await fetchResults();
        if (active)
          setState({ owner, results, loaded: true, error: "", saving: false });
      } catch (error) {
        if (active)
          setState({
            owner,
            results,
            loaded: true,
            saving: false,
            error:
              error instanceof Error
                ? error.message
                : "계정 결과를 불러오지 못했어요.",
          });
      }
    }
    void Promise.resolve().then(synchronize);
    return () => {
      active = false;
      controller.abort();
    };
  }, [owner, path, data.firstRunId, attempt]);
  const current = owner && state.owner === owner;
  return (
    <Context.Provider
      value={{
        results: current ? state.results : [],
        loaded: !owner || Boolean(current && state.loaded),
        saving: Boolean(owner && (!current || state.saving)),
        error: current ? state.error : "",
        refresh: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAccountResults = () => useContext(Context);
