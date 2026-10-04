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
import { useAuth } from "./auth-provider";

function resultError(error: unknown, fallback: string) {
  return error instanceof Error &&
    !["AbortError", "TimeoutError", "TypeError"].includes(error.name)
    ? error.message
    : fallback;
}

const Context = createContext({
  results: [] as Session[],
  loaded: true,
  error: "",
  loadError: "",
  saving: false,
  refresh: () => {},
});
export function AccountResultsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useCollection();
  const { refresh: refreshAuth } = useAuth();
  const path = usePathname();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    owner: "",
    results: [] as Session[],
    loaded: false,
    error: "",
    loadError: "",
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
        loadError: "",
      }));
      let results: Session[] | null = null;
      let loadError = "";
      try {
        const fetchResults = async () => {
          const response = await fetch("/api/results", {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10000),
            ]),
          });
          if (response.status === 401) void refreshAuth();
          if (!response.ok)
            throw new Error(
              "계정 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
            );
          const payload = await response.json();
          if (!Array.isArray(payload.results))
            throw new Error(
              "계정 결과 응답을 확인하지 못했어요. 다시 시도해 주세요.",
            );
          return (payload.results as unknown[])
            .map((item) => parseSession(JSON.stringify(item), Date.now(), true))
            .filter((item): item is Session => Boolean(item?.result));
        };
        try {
          results = await fetchResults();
        } catch (error) {
          loadError = resultError(
            error,
            "계정 결과에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.",
          );
          throw error;
        }
        const local = [readFirstSession(), readSession()];
        const seen = new Set(results.map((r) => r.runId));
        let changed = false;
        const failures: string[] = [];
        for (const session of local) {
          if (!session?.result || seen.has(session.runId)) continue;
          seen.add(session.runId);
          try {
            const response = await fetch("/api/results", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(session),
              signal: AbortSignal.any([
                controller.signal,
                AbortSignal.timeout(10000),
              ]),
            });
            if (response.status === 401) void refreshAuth();
            if (!response.ok)
              throw new Error(
                response.status === 409
                  ? "이 기기의 결과는 다른 계정에 저장됐거나 기존 기록과 달라요. 본인 계정인지 확인해 주세요."
                  : "검사 결과를 계정에 저장하지 못했어요. 아래 버튼으로 다시 시도해 주세요.",
              );
            changed = true;
          } catch (error) {
            if (!active) return;
            failures.push(
              resultError(
                error,
                "검사 결과를 계정에 저장하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.",
              ),
            );
          }
        }
        if (changed) {
          try {
            results = await fetchResults();
          } catch (error) {
            loadError = resultError(
              error,
              "저장한 결과를 다시 확인하지 못했어요. 다시 시도해 주세요.",
            );
            throw error;
          }
        }
        if (active)
          setState({
            owner,
            results,
            loaded: true,
            error: [...new Set(failures)].join(" "),
            loadError: "",
            saving: false,
          });
      } catch (error) {
        if (active)
          setState((old) => ({
            owner,
            results: results ?? (old.owner === owner ? old.results : []),
            loaded: true,
            saving: false,
            loadError,
            error:
              loadError ||
              resultError(
                error,
                "계정 결과를 불러오지 못했어요. 네트워크를 확인해 주세요.",
              ),
          }));
      }
    }
    void Promise.resolve().then(synchronize);
    return () => {
      active = false;
      controller.abort();
    };
  }, [owner, path, data.firstRunId, attempt, refreshAuth]);
  const current = owner && state.owner === owner;
  return (
    <Context.Provider
      value={{
        results: current ? state.results : [],
        loaded: !owner || Boolean(current && state.loaded),
        saving: Boolean(owner && (!current || state.saving)),
        error: current ? state.error : "",
        loadError: current ? state.loadError : "",
        refresh: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAccountResults = () => useContext(Context);
