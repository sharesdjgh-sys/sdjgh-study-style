import { expect, it } from "vitest";
import { access } from "node:fs/promises";
import { resultCardData } from "../../src/lib/result-card";
import { resultCardTemplate } from "../../src/lib/result-card-templates";
import {
  STUDY_TYPES,
  SITUATIONS,
  VERSION,
  QUESTIONS,
} from "../../src/lib/content";
import { answersFor } from "../answers";
import type { Session } from "../../src/lib/storage";
function session(code: string): Session {
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    startedAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: Date.now(),
    source: "direct",
    answers: answersFor(code),
    index: QUESTIONS.length - 1,
    choices: {},
    result: code,
  };
}
it("실제 6·3·2·1 응답을 50·25·17·8로 합계 100% 반영한다", () => {
  const s = session("visual-solo-planned");
  const selected = [
    ...Array(6).fill("visual"),
    ...Array(3).fill("auditory"),
    ...Array(2).fill("tactile"),
    "motion",
  ];
  SITUATIONS.forEach((q, i) => {
    s.answers[q.id] = selected[i];
  });
  const data = resultCardData(s);
  expect(data.rows.map((r) => r.percent)).toEqual([50, 25, 17, 8]);
  expect(data.method.name).toBe("목차 공부법");
});
it("16종 모두 전용 원화와 시그니처를 가지며 실제 선택 횟수로 계산한다", async () => {
  for (const type of STUDY_TYPES) {
    await access(`public${resultCardTemplate(type.code).src}`);
    const data = resultCardData(session(type.code));
    expect(data.rows.find((r) => r.key === type.modality)?.percent).toBe(100);
    expect(data.rows.reduce((sum, r) => sum + r.percent, 0)).toBe(100);
    expect(data.method.name.length).toBeGreaterThan(0);
  }
});
