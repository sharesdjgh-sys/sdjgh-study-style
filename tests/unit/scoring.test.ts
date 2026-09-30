import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  STUDY_TYPES,
  MODALITIES,
  type Answers,
} from "../../src/lib/content";
import { scoreAnswers, resolveType } from "../../src/lib/scoring";
export function answersFor(type = STUDY_TYPES[0]): Answers {
  return Object.fromEntries(
    QUESTIONS.map((q) => [
      q.id,
      [type.modality, type.social, type.pace].includes(q.axis) ? 5 : 1,
    ]),
  );
}
describe("16유형 채점", () => {
  it("큰 유형마다 세 문항을 배정한다", () => {
    expect(QUESTIONS).toHaveLength(16);
    for (const m of MODALITIES)
      expect(QUESTIONS.filter((q) => q.axis === m)).toHaveLength(3);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(16);
  });
  for (const type of STUDY_TYPES)
    it(type.code, () =>
      expect(resolveType(scoreAnswers(answersFor(type)), {})).toBe(type.code),
    );
  it("모두 중립이면 임의로 유형을 정하지 않는다", () => {
    const score = scoreAnswers(
      Object.fromEntries(QUESTIONS.map((q) => [q.id, 3])),
    );
    expect(score.uniform).toBe(true);
    expect(score.candidates.modality).toHaveLength(4);
    expect(resolveType(score, {})).toBeNull();
    expect(
      resolveType(score, {
        modality: "motion",
        social: "team",
        pace: "flexible",
      }),
    ).toBe("motion-team-flexible");
  });
  it("동점이 아닌 범주를 사용자가 바꿀 수 없다", () => {
    const score = scoreAnswers(answersFor());
    expect(resolveType(score, { modality: "motion", social: "team" })).toBe(
      STUDY_TYPES[0].code,
    );
  });
  it("근소한 합계 차이를 표시한다", () => {
    const a = answersFor();
    a.a1 = 5;
    a.a2 = 5;
    a.a3 = 4;
    expect(scoreAnswers(a).close.modalities).toEqual(["visual", "auditory"]);
  });
  it("누락과 범위 밖 점수를 거부한다", () => {
    expect(() => scoreAnswers({})).toThrow();
    const a = answersFor();
    a.v1 = 6 as 1;
    expect(() => scoreAnswers(a)).toThrow();
  });
  it("응답 객체의 순서에 영향을 받지 않는다", () => {
    const a = answersFor();
    expect(
      scoreAnswers(Object.fromEntries(Object.entries(a).reverse())),
    ).toEqual(scoreAnswers(a));
  });
});
