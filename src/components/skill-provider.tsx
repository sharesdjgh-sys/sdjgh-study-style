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
import { useCollection } from "./collection-provider";
import { EMPTY_SKILLS, type SkillProgress } from "@/lib/skill-economy";
type Action = {
  action: string;
  method?: string;
  id?: string;
  answers?: number[];
  standalone?: boolean;
  mobile?: boolean;
  confirmed?: boolean;
};
type State = {
  owner?: string;
  progress: SkillProgress;
  loaded: boolean;
  error: boolean;
};
const Context = createContext({
  progress: EMPTY_SKILLS,
  loaded: false,
  error: false,
  signedIn: false,
  refresh: async () => {},
  act: (async () => {
    throw Error("unavailable");
  }) as (input: Action) => Promise<{ awarded: number; outcome: string }>,
});
export function SkillProvider({ children }: { children: ReactNode }) {
  const { data } = useCollection();
  const owner = data.signedIn ? data.accountId : undefined;
  const current = useRef(owner);
  useEffect(() => {
    current.current = owner;
  }, [owner]);
  const serial = useRef(0);
  const [state, setState] = useState<State>({
    progress: EMPTY_SKILLS,
    loaded: false,
    error: false,
  });
  const refresh = useCallback(async () => {
    if (!owner) return;
    const request = ++serial.current;
    try {
      const response = await fetch("/api/skills", {
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
          progress: old.owner === owner ? old.progress : EMPTY_SKILLS,
          owner,
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
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh, data.cards, data.pending]);
  const act = useCallback(
    async (input: Action) => {
      if (!owner) throw Error("unauthorized");
      ++serial.current;
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (current.current !== owner) throw Error("unauthorized");
      if (!response.ok) {
        void refresh();
        throw Error(result.error ?? "unavailable");
      }
      if (result.accountId !== owner) throw Error("unauthorized");
      ++serial.current;
      setState({
        owner,
        progress: result.progress,
        loaded: true,
        error: false,
      });
      if (input.action === "complete")
        window.dispatchEvent(new Event("study:stars"));
      return {
        awarded: result.awarded as number,
        outcome: result.outcome as string,
      };
    },
    [owner, refresh],
  );
  const valid = Boolean(owner && state.owner === owner);
  return (
    <Context.Provider
      value={{
        progress: valid ? state.progress : EMPTY_SKILLS,
        loaded: !owner || (valid && state.loaded),
        error: valid && state.error,
        signedIn: !!owner,
        refresh,
        act,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSkills = () => useContext(Context);
export const SKILL_ERRORS: Record<string, string> = {
  insufficient_hearts:
    "하트가 조금 부족해요. 새 카드나 홈 화면 추가 선물로 모아 보세요.",
  unauthorized: "로그인 후 이용해 주세요.",
  active_practice: "진행 중인 실천을 마치거나 중단한 뒤 시작해 주세요.",
  too_early: "아직 10분이 지나지 않았어요. 타이머를 이어가 주세요.",
  unavailable: "잠시 연결이 끊겼어요. 다시 시도해 주세요.",
  locked: "먼저 이 스킬의 자물쇠를 열어 주세요.",
  rate_limit: "잠시 후 다시 시도해 주세요.",
};
