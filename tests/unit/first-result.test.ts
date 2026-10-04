import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  newSession,
  saveSession,
  readSession,
  readFirstSession,
  rememberFirstSession,
  clearSession,
  type Session,
} from "../../src/lib/storage";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";
const values = new Map<string, string>();
beforeEach(() => {
  vi.stubGlobal("window", { location: { search: "" } });
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  vi.stubGlobal("sessionStorage", {
    getItem: () => null,
    removeItem: () => {},
  });
  clearSession();
  values.clear();
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});
function complete(type = "visual-solo-planned"): Session {
  const now = Date.now();
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    source: "direct",
    startedAt: now,
    updatedAt: now,
    completedAt: now,
    index: QUESTIONS.length - 1,
    choices: {},
    result: type,
    answers: answersFor(type),
  };
}
it("첫 결과를 보존하고 재검사의 최근 결과와 분리한다", () => {
  const first = complete();
  saveSession(first);
  rememberFirstSession(first);
  expect(newSession().isRetake).toBe(true);
  const retake = { ...complete("motion-team-flexible"), isRetake: true };
  saveSession(retake);
  rememberFirstSession(retake);
  expect(readSession()?.result).toBe(retake.result);
  expect(readFirstSession()?.runId).toBe(first.runId);
});
it("기존 완료 결과를 처음 읽을 때 이관하고 기기 기록 삭제 시 둘 다 지운다", () => {
  const first = complete();
  saveSession(first);
  expect(readFirstSession()?.runId).toBe(first.runId);
  clearSession();
  expect(readFirstSession()).toBeNull();
  expect(readSession()).toBeNull();
  expect(newSession().isRetake).toBe(false);
});
it("보관 기간이 지난 최초 응답은 복구하거나 전송하지 않는다", () => {
  const first = complete();
  first.completedAt = Date.now() - 8 * 86400000;
  values.set("study-style:first-result", JSON.stringify(first));
  expect(readFirstSession()).toBeNull();
  expect(values.has("study-style:first-result")).toBe(false);
});
it("다른 탭에서 삭제한 기록을 메모리에서 되살리지 않는다", () => {
  const first = complete();
  saveSession(first);
  rememberFirstSession(first);
  values.clear();
  expect(readSession()).toBeNull();
  expect(readFirstSession()).toBeNull();
  expect(newSession().isRetake).toBe(false);
  expect(values.size).toBe(0);
});
it("삭제 후 새 첫 결과가 이전 메모리 때문에 무시되지 않는다", () => {
  const first = complete();
  saveSession(first);
  rememberFirstSession(first);
  values.clear();
  const next = complete("motion-team-flexible");
  saveSession(next);
  rememberFirstSession(next);
  expect(readFirstSession()?.runId).toBe(next.runId);
});
it("첫 기록이 만료되어도 최근 재검사가 있으면 재검사를 유지한다", () => {
  const first = complete();
  first.completedAt = Date.now() - 8 * 86400000;
  values.set("study-style:first-result", JSON.stringify(first));
  saveSession({ ...complete("motion-team-flexible"), isRetake: true });
  expect(readFirstSession()).toBeNull();
  expect(newSession().isRetake).toBe(true);
});
it("저장 용량 초과 시에는 현재 창의 메모리 결과를 유지한다", () => {
  vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  const first = complete();
  expect(saveSession(first)).toBe(false);
  rememberFirstSession(first);
  expect(readSession()?.runId).toBe(first.runId);
  expect(readFirstSession()?.runId).toBe(first.runId);
});
