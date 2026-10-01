import {
  MODALITIES,
  QUESTIONS,
  SITUATIONS,
  PAIRS,
  isValidAnswer,
  type Answers,
  type Modality,
  type PairAnswer,
  type PairQuestion,
  type Social,
  type Pace,
} from "./content";
export type Strength = "close" | "clear" | "strong";
export type Scores = {
  /** 상황형에서 방식마다 고른 횟수(합계는 상황형 문항 수) */
  counts: Record<Modality, number>;
  /** 함께 쪽이 +, 혼자 쪽이 −. 홀수 개 문항의 홀수 점수 합이라 0이 되지 않아요. */
  social: number;
  /** 계획 쪽이 +, 즉흥 쪽이 −. */
  pace: number;
  candidates: { modality: Modality[]; social: Social[]; pace: Pace[] };
  close: { modalities: Modality[]; social: boolean; pace: boolean };
  /** 네 방식을 똑같은 횟수로 고름(예: 3:3:3:3) */
  uniform: boolean;
};
export type Choices = { modality?: Modality; social?: Social; pace?: Pace };
const POSITION = [-3, -1, 1, 3] as const;
export const CLOSE_AXIS = 3;
/** 위/아래 위치 점수를 함께·계획이 +가 되도록 바꿔요. */
export function pairScore(q: PairQuestion, answer: PairAnswer) {
  const position = POSITION[answer - 1];
  return q.top.pole === "team" || q.top.pole === "planned"
    ? -position
    : position;
}
/** 한 축의 합계가 가질 수 있는 가장 큰 절댓값(문항 수 × 3) */
export const AXIS_MAX = 3 * PAIRS.filter((q) => q.axis === "social").length;
export const STRENGTH_TEXT: Record<Strength, string> = {
  close: "조금 더 가까워요. 상황에 따라 두 방식을 오가는 편이에요.",
  clear: "꽤 가까워요.",
  strong: "뚜렷하게 가까워요.",
};
export function axisStrength(value: number): Strength {
  const size = Math.abs(value);
  return size <= CLOSE_AXIS ? "close" : size <= 9 ? "clear" : "strong";
}
export function scoreAnswers(answers: Answers): Scores {
  if (QUESTIONS.some((q) => !isValidAnswer(q, answers[q.id])))
    throw new Error("모든 문항에 답해주세요.");
  const counts: Record<Modality, number> = {
    visual: 0,
    auditory: 0,
    tactile: 0,
    motion: 0,
  };
  for (const q of SITUATIONS) counts[answers[q.id] as Modality]++;
  const sum = (axis: PairQuestion["axis"]) =>
    PAIRS.filter((q) => q.axis === axis).reduce(
      (total, q) => total + pairScore(q, answers[q.id] as PairAnswer),
      0,
    );
  const social = sum("social");
  const pace = sum("pace");
  const max = Math.max(...Object.values(counts));
  return {
    counts,
    social,
    pace,
    candidates: {
      modality: MODALITIES.filter((m) => counts[m] === max),
      social: [social > 0 ? "team" : "solo"],
      pace: [pace > 0 ? "planned" : "flexible"],
    },
    close: {
      modalities: MODALITIES.filter((m) => max - counts[m] <= 1),
      social: Math.abs(social) <= CLOSE_AXIS,
      pace: Math.abs(pace) <= CLOSE_AXIS,
    },
    uniform: new Set(Object.values(counts)).size === 1,
  };
}
export function resolveType(scores: Scores, choices: Choices) {
  const modality =
    scores.candidates.modality.length === 1
      ? scores.candidates.modality[0]
      : choices.modality;
  const social =
    scores.candidates.social.length === 1
      ? scores.candidates.social[0]
      : choices.social;
  const pace =
    scores.candidates.pace.length === 1
      ? scores.candidates.pace[0]
      : choices.pace;
  if (
    !modality ||
    !social ||
    !pace ||
    !scores.candidates.modality.includes(modality) ||
    !scores.candidates.social.includes(social) ||
    !scores.candidates.pace.includes(pace)
  )
    return null;
  return `${modality}-${social}-${pace}`;
}
