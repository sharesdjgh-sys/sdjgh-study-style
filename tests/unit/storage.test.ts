import { describe, it, expect } from "vitest";
import { parseSession, DAY } from "../../src/lib/storage";
import { QUESTIONS, VERSION, STUDY_TYPES } from "../../src/lib/content";
const now = Date.now();
const base = {
  version: VERSION,
  runId: "123e4567-e89b-42d3-a456-426614174000",
  source: "direct",
  startedAt: now - 1000,
  updatedAt: now - 500,
  answers: { v1: 3 },
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
      parseSession(JSON.stringify({ ...base, answers: { intruder: 5 } })),
    ).toBeNull();
  });
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
    const answers = Object.fromEntries(
      QUESTIONS.map((q) => [
        q.id,
        ["visual", "solo", "planned"].includes(q.axis) ? 5 : 1,
      ]),
    );
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
