import { describe, it, expect } from "vitest";
import { STUDY_TYPES, MODALITIES, VERSION } from "../../src/lib/content";
import {
  FAMILY_METHODS,
  METHOD_IDS,
  SIGNATURE_METHODS,
  STUDY_METHODS,
  TASKS,
  getMethod,
  lineupFor,
  methodOwner,
  missionMethod,
  type MethodId,
} from "../../src/lib/methods";
import { parseSession } from "../../src/lib/storage";
import { answersFor } from "../answers";

describe("공부캐별 공부법", () => {
  it("16유형마다 서로 다른 시그니처 공부법이 있다", () => {
    const signatures = STUDY_TYPES.map((t) => SIGNATURE_METHODS[t.code]);
    expect(signatures.every(Boolean)).toBe(true);
    expect(new Set(signatures).size).toBe(16);
  });
  it("계열 공부법 12개와 시그니처 16개가 겹치지 않고 28개 공부법을 모두 쓴다", () => {
    const family = MODALITIES.flatMap((m) => Object.values(FAMILY_METHODS[m]));
    expect(new Set(family).size).toBe(12);
    const used = [...family, ...Object.values(SIGNATURE_METHODS)];
    expect(new Set(used).size).toBe(28);
    expect([...used].sort()).toEqual([...METHOD_IDS].sort());
  });
  it("모든 공부법에 이름·한 줄 풀이·4단계·수준 규칙·원리가 있다", () => {
    const names = new Set<string>();
    for (const id of METHOD_IDS) {
      const m = getMethod(id);
      expect(m.name.length, id).toBeGreaterThan(0);
      expect(m.oneLine.length, id).toBeGreaterThan(0);
      expect(m.steps, id).toHaveLength(4);
      expect(
        m.steps.every((step) => step.length > 0),
        id,
      ).toBe(true);
      expect(m.level.length, id).toBeGreaterThan(0);
      expect(m.principles.length, id).toBeGreaterThan(0);
      expect(m.aka.length, id).toBeGreaterThan(0);
      names.add(m.name);
    }
    expect(names.size).toBe(METHOD_IDS.length);
  });
  it("모든 공부법에 떠올리기나 간격 두기 기본기가 들어 있다", () => {
    for (const id of METHOD_IDS)
      expect(
        getMethod(id).principles.some(
          (p) => p === "retrieval" || p === "spacing",
        ),
        id,
      ).toBe(true);
  });
  it("함께하는 공부캐의 시그니처는 혼자 하는 방법도 알려 준다", () => {
    for (const t of STUDY_TYPES.filter((type) => type.social === "team"))
      expect(getMethod(SIGNATURE_METHODS[t.code]).alone, t.code).toBeTruthy();
  });
  it("공부캐마다 공부법 4개(시그니처 + 과제별 3개)와 팁 2개를 보여 주고, 근거 탄탄한 공부법이 하나 이상 있다", () => {
    for (const t of STUDY_TYPES) {
      const lineup = lineupFor(t);
      const ids = [lineup.signature, ...lineup.byTask.map((b) => b.method)];
      expect(new Set(ids).size, t.code).toBe(4);
      expect(lineup.byTask.map((b) => b.task)).toEqual(Object.keys(TASKS));
      expect(lineup.tips).toHaveLength(2);
      expect(
        ids.some((id) => getMethod(id).evidence === "strong"),
        t.code,
      ).toBe(true);
    }
  });
  it("공부법을 즐겨 쓰는 공부캐를 찾는다", () => {
    expect(methodOwner("leitner")).toEqual({
      kind: "family",
      modality: "tactile",
    });
    expect(methodOwner("outline")).toEqual({
      kind: "signature",
      code: "visual-solo-planned",
    });
  });
});
describe("활동 기록 호환", () => {
  const code = "tactile-solo-planned";
  const completed = (mission: object) =>
    JSON.stringify({
      version: VERSION,
      runId: "123e4567-e89b-42d3-a456-426614174000",
      source: "direct",
      startedAt: Date.now() - 2000,
      updatedAt: Date.now() - 1000,
      completedAt: Date.now() - 1000,
      answers: answersFor(code),
      index: 0,
      choices: {},
      result: code,
      mission,
    });
  it("공부법 ID로 저장한 기록을 복원한다", () => {
    const s = parseSession(completed({ method: "error-note", started: true }));
    expect(s?.mission && missionMethod(s.mission)).toBe("error-note");
  });
  it("예전 방식·과제 기록을 계열 공부법으로 읽는다", () => {
    const s = parseSession(
      completed({ modality: "tactile", task: "memory", started: false }),
    );
    expect(s?.mission && missionMethod(s.mission)).toBe(
      "leitner" satisfies MethodId,
    );
  });
  it("알 수 없는 공부법 ID는 기록을 버린다", () =>
    expect(
      parseSession(completed({ method: "no-such-method", started: true })),
    ).toBeNull());
  it("공부법 데이터와 ID 목록이 같다", () =>
    expect(Object.keys(STUDY_METHODS)).toEqual(METHOD_IDS));
});
