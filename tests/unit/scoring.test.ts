import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  SITUATIONS,
  PAIRS,
  STUDY_TYPES,
  MODALITIES,
  type Answers,
  type Modality,
  type PairAnswer,
} from "../../src/lib/content";
import {
  scoreAnswers,
  resolveType,
  pairScore,
  axisStrength,
  AXIS_MAX,
} from "../../src/lib/scoring";
import { answersFor } from "../answers";
const base = STUDY_TYPES[0].code; // visual-solo-planned
function withCounts(counts: Record<Modality, number>, code = base): Answers {
  const answers = answersFor(code);
  const picks = MODALITIES.flatMap((m) => Array(counts[m]).fill(m));
  SITUATIONS.forEach((q, i) => (answers[q.id] = picks[i]));
  return answers;
}
describe("검사지 구성", () => {
  it("상황형 12문항과 축마다 양극형 5문항으로 22문항이다", () => {
    expect(QUESTIONS).toHaveLength(22);
    expect(SITUATIONS).toHaveLength(12);
    expect(PAIRS.filter((q) => q.axis === "social")).toHaveLength(5);
    expect(PAIRS.filter((q) => q.axis === "pace")).toHaveLength(5);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(22);
  });
  it("상황형마다 네 방식의 선택지가 하나씩 있고 위치가 고르게 돌아간다", () => {
    const positions = Object.fromEntries(
      MODALITIES.map((m) => [m, [0, 0, 0, 0]]),
    );
    for (const q of SITUATIONS) {
      expect(new Set(q.options.map((o) => o.modality))).toEqual(
        new Set(MODALITIES),
      );
      q.options.forEach((o, i) => positions[o.modality][i]++);
    }
    for (const m of MODALITIES) expect(positions[m]).toEqual([3, 3, 3, 3]);
  });
  it("양극형은 두 극을 위아래로 번갈아 둔다", () => {
    for (const axis of ["social", "pace"] as const) {
      const pairs = PAIRS.filter((q) => q.axis === axis);
      const poles =
        axis === "social" ? ["solo", "team"] : ["planned", "flexible"];
      for (const q of pairs) {
        expect(poles).toContain(q.top.pole);
        expect(poles).toContain(q.bottom.pole);
        expect(q.top.pole).not.toBe(q.bottom.pole);
      }
      const tops = pairs.map((q) => q.top.pole);
      expect(new Set(tops).size).toBe(2);
    }
  });
});
describe("16유형 채점", () => {
  for (const type of STUDY_TYPES)
    it(type.code, () =>
      expect(resolveType(scoreAnswers(answersFor(type.code)), {})).toBe(
        type.code,
      ),
    );
  it("상황형에서 고른 횟수를 세고 가장 많은 방식을 대표로 삼는다", () => {
    const score = scoreAnswers(
      withCounts({ visual: 5, auditory: 3, tactile: 2, motion: 2 }),
    );
    expect(score.counts).toEqual({
      visual: 5,
      auditory: 3,
      tactile: 2,
      motion: 2,
    });
    expect(score.candidates.modality).toEqual(["visual"]);
    expect(score.close.modalities).toEqual(["visual"]);
  });
  it("1위와 1번 차이인 방식은 비슷하게 고른 것으로 표시한다", () => {
    const score = scoreAnswers(
      withCounts({ visual: 4, auditory: 3, tactile: 3, motion: 2 }),
    );
    expect(score.candidates.modality).toEqual(["visual"]);
    expect(score.close.modalities).toEqual(["visual", "auditory", "tactile"]);
  });
  it("가장 많이 고른 방식이 여럿이면 직접 고른 방식만 받아들인다", () => {
    const score = scoreAnswers(
      withCounts({ visual: 4, auditory: 2, tactile: 4, motion: 2 }),
    );
    expect(score.candidates.modality).toEqual(["visual", "tactile"]);
    expect(resolveType(score, {})).toBeNull();
    expect(resolveType(score, { modality: "auditory" })).toBeNull();
    expect(resolveType(score, { modality: "tactile" })).toBe(
      "tactile-solo-planned",
    );
  });
  it("네 방식을 고르게 고르면 네 후보를 모두 보여 준다", () => {
    const score = scoreAnswers(
      withCounts({ visual: 3, auditory: 3, tactile: 3, motion: 3 }),
    );
    expect(score.uniform).toBe(true);
    expect(score.candidates.modality).toHaveLength(4);
  });
  it("늘 같은 위치만 누르면 동점과 근소 차이로 처리된다", () => {
    const answers: Answers = {};
    for (const q of QUESTIONS)
      answers[q.id] = q.kind === "situation" ? q.options[0].modality : 1;
    const score = scoreAnswers(answers);
    expect(score.uniform).toBe(true);
    expect(Math.abs(score.social)).toBe(3);
    expect(Math.abs(score.pace)).toBe(3);
    expect(score.close).toMatchObject({ social: true, pace: true });
  });
  it("양극형 점수는 함께·계획이 양수가 되도록 바꾼다", () => {
    const top = PAIRS.find((q) => q.top.pole === "team")!;
    expect(pairScore(top, 1)).toBe(3);
    expect(pairScore(top, 4)).toBe(-3);
    const solo = PAIRS.find((q) => q.top.pole === "solo")!;
    expect(pairScore(solo, 1)).toBe(-3);
    expect(pairScore(solo, 3)).toBe(1);
  });
  it("보조 축 합계는 어떤 응답 조합에서도 0이 되지 않는다", () => {
    const social = PAIRS.filter((q) => q.axis === "social");
    const values: PairAnswer[] = [1, 2, 3, 4];
    let combos = 0;
    const walk = (i: number, sum: number) => {
      if (i === social.length) {
        combos++;
        expect(sum).not.toBe(0);
        return;
      }
      for (const v of values) walk(i + 1, sum + pairScore(social[i], v));
    };
    walk(0, 0);
    expect(combos).toBe(4 ** social.length);
    expect(AXIS_MAX).toBe(15);
  });
  it("축 강도를 근소·꽤·뚜렷으로 나눈다", () => {
    expect([1, 3, 5, 9, 11, 15].map(axisStrength)).toEqual([
      "close",
      "close",
      "clear",
      "clear",
      "strong",
      "strong",
    ]);
    expect(axisStrength(-7)).toBe("clear");
  });
  it("문서의 채점 예시 1과 같은 결과를 낸다", () => {
    const answers = withCounts({
      visual: 5,
      auditory: 3,
      tactile: 2,
      motion: 2,
    });
    Object.assign(answers, {
      "B-S1": 2,
      "B-S2": 4,
      "B-S3": 3,
      "B-S4": 3,
      "B-S5": 1,
      "B-P1": 1,
      "B-P2": 3,
      "B-P3": 3,
      "B-P4": 4,
      "B-P5": 2,
    });
    const score = scoreAnswers(answers);
    expect(score.social).toBe(-7);
    expect(score.pace).toBe(7);
    expect(resolveType(score, {})).toBe("visual-solo-planned");
  });
  it("동점이 아닌 범주를 사용자가 바꿀 수 없다", () => {
    const score = scoreAnswers(answersFor(base));
    expect(
      resolveType(score, {
        modality: "motion",
        social: "team",
        pace: "flexible",
      }),
    ).toBe(base);
  });
  it("누락·형식이 다른 응답을 거부한다", () => {
    expect(() => scoreAnswers({})).toThrow();
    const missing = answersFor(base);
    delete missing.A01;
    expect(() => scoreAnswers(missing)).toThrow();
    const wrongKind = answersFor(base);
    wrongKind.A01 = 3;
    expect(() => scoreAnswers(wrongKind)).toThrow();
    const outOfRange = answersFor(base);
    outOfRange["B-S1"] = 5 as PairAnswer;
    expect(() => scoreAnswers(outOfRange)).toThrow();
    const pairAsModality = answersFor(base);
    pairAsModality["B-P1"] = "visual";
    expect(() => scoreAnswers(pairAsModality)).toThrow();
  });
  it("응답 객체의 순서에 영향을 받지 않는다", () => {
    const a = answersFor(base);
    expect(
      scoreAnswers(Object.fromEntries(Object.entries(a).reverse())),
    ).toEqual(scoreAnswers(a));
  });
});
