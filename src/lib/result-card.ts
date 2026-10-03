import {
  FAMILIES,
  MODALITIES,
  PACE_LABELS,
  SOCIAL_LABELS,
  getType,
  type Answers,
} from "./content";
import { CHARACTERS } from "./characters";
import { getMethod, SIGNATURE_METHODS } from "./methods";
import { scoreAnswers } from "./scoring";
import type { Session } from "./storage";

/** Largest-remainder rounding keeps the four displayed shares at exactly 100%. */
export function resultCardData(session: Session) {
  const type = session.result ? getType(session.result) : null;
  if (!type) throw new Error("완료한 검사 결과가 필요해요.");
  const scores = scoreAnswers(session.answers as Answers);
  const total = MODALITIES.reduce((sum, m) => sum + scores.counts[m], 0);
  if (!total) throw new Error("검사 응답을 모두 완료해 주세요.");
  const rows = MODALITIES.map((m) => ({
    key: m,
    label: FAMILIES[m].label,
    count: scores.counts[m],
    percent: Math.floor((scores.counts[m] / total) * 100),
    fraction: scores.counts[m] / total,
  }));
  const order = [...rows].sort(
    (a, b) => b.fraction * 100 - b.percent - (a.fraction * 100 - a.percent),
  );
  const remainder = 100 - rows.reduce((sum, r) => sum + r.percent, 0);
  for (let i = 0; i < remainder; i++) order[i].percent++;
  return {
    type,
    character: CHARACTERS[type.code],
    rows,
    total,
    traits: [
      FAMILIES[type.modality].label,
      SOCIAL_LABELS[type.social],
      PACE_LABELS[type.pace],
    ],
    method: getMethod(SIGNATURE_METHODS[type.code]),
  };
}
