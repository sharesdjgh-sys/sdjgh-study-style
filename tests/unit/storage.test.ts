import { describe, it, expect } from "vitest";
import { parseSession, DAY } from "../../src/lib/storage";
import { VERSION, STUDY_TYPES } from "../../src/lib/content";
import { answersFor } from "../answers";
const now = Date.now();
const base = {
  version: VERSION,
  runId: "123e4567-e89b-42d3-a456-426614174000",
  source: "direct",
  startedAt: now - 1000,
  updatedAt: now - 500,
  answers: { A01: "visual", "B-S1": 2 },
  index: 0,
  choices: {},
  result: null,
};
describe("기기 저장 데이터", () => {
  it("정상 진행을 복원한다", () =>
    expect(parseSession(JSON.stringify(base), now)?.index).toBe(0));
  it("24시간이 지난 진행을 제거한다", () =>
    expect(
      parseSession(JSON.stringify({ ...base, updatedAt: now - DAY - 1 }), now),
    ).toBeNull());
  it("손상·버전 불일치·알 수 없는 문항을 거부한다", () => {
    expect(parseSession("broken")).toBeNull();
    expect(
      parseSession(JSON.stringify({ ...base, version: "old" })),
    ).toBeNull();
    expect(
      parseSession(JSON.stringify({ ...base, answers: { intruder: 3 } })),
    ).toBeNull();
  });
  it("문항 형식과 맞지 않는 응답을 거부한다", () => {
    for (const answers of [
      { A01: 3 },
      { A01: "reading" },
      { "B-S1": "visual" },
      { "B-S1": 5 },
      { "B-S1": 0 },
    ])
      expect(
        parseSession(JSON.stringify({ ...base, answers }), now),
      ).toBeNull();
  });
  it("이전 버전(2026-09-v1)의 5점 응답은 복원하지 않는다", () =>
    expect(
      parseSession(
        JSON.stringify({ ...base, version: "2026-09-v1", answers: { v1: 3 } }),
        now,
      ),
    ).toBeNull());
  it("조작된 결과와 미완료 결과를 거부한다", () =>
    expect(
      parseSession(
        JSON.stringify({
          ...base,
          result: STUDY_TYPES[0].code,
          completedAt: now,
        }),
        now,
      ),
    ).toBeNull());
  it("완료한 결과를 7일 동안만 보관한다", () => {
    const answers = answersFor(STUDY_TYPES[0].code);
    const s = {
      ...base,
      answers,
      result: STUDY_TYPES[0].code,
      completedAt: now - 6 * DAY,
    };
    expect(parseSession(JSON.stringify(s), now)).not.toBeNull();
    expect(
      parseSession(
        JSON.stringify({ ...s, completedAt: now - 7 * DAY - 1 }),
        now,
      ),
    ).toBeNull();
  });
});
