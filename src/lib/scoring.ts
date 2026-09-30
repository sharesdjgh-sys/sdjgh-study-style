import {
  MODALITIES,
  QUESTIONS,
  type Answers,
  type Modality,
  type Social,
  type Pace,
} from "./content";
export type Scores = {
  totals: Record<Modality, number>;
  candidates: { modality: Modality[]; social: Social[]; pace: Pace[] };
  close: { modalities: Modality[]; social: boolean; pace: boolean };
  uniform: boolean;
};
export type Choices = { modality?: Modality; social?: Social; pace?: Pace };
export function scoreAnswers(answers: Answers): Scores {
  if (
    QUESTIONS.some(
      (q) =>
        !Number.isInteger(answers[q.id]) ||
        answers[q.id]! < 1 ||
        answers[q.id]! > 5,
    )
  )
    throw new Error("모든 문항에 답해주세요.");
  const totals: Record<Modality, number> = {
    visual: 0,
    auditory: 0,
    tactile: 0,
    motion: 0,
  };
  for (const q of QUESTIONS)
    if (MODALITIES.includes(q.axis as Modality))
      totals[q.axis as Modality] += answers[q.id]!;
  const max = Math.max(...Object.values(totals));
  const social = answers.s2! - answers.s1!;
  const pace = answers.p1! - answers.p2!;
  return {
    totals,
    candidates: {
      modality: MODALITIES.filter((m) => totals[m] === max),
      social: social === 0 ? ["solo", "team"] : [social > 0 ? "team" : "solo"],
      pace:
        pace === 0
          ? ["planned", "flexible"]
          : [pace > 0 ? "planned" : "flexible"],
    },
    close: {
      modalities: MODALITIES.filter((m) => max - totals[m] <= 1),
      social: Math.abs(social) <= 1,
      pace: Math.abs(pace) <= 1,
    },
    uniform: new Set(QUESTIONS.map((q) => answers[q.id])).size === 1,
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
