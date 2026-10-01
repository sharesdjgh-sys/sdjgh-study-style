import { QUESTIONS, type Answer } from "../src/lib/content";
/** 해당 유형이 나오도록 모든 문항에 가장 강하게 답한 응답을 만들어요. */
export function answersFor(code: string): Record<string, Answer> {
  const [modality, social, pace] = code.split("-");
  return Object.fromEntries(
    QUESTIONS.map((q) => [
      q.id,
      q.kind === "situation"
        ? modality
        : [social, pace].includes(q.top.pole)
          ? 1
          : 4,
    ]),
  ) as Record<string, Answer>;
}
