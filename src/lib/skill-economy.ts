import { METHOD_IDS, methodOwner, type MethodId } from "./methods";

const ONE_HEART = new Set<MethodId>([
  "blank-page",
  "self-quiz",
  "self-explanation",
  "card-sort",
  "gesture",
  "spaced-retry",
]);
export function skillPrice(id: MethodId): 1 | 2 | 3 {
  return methodOwner(id).kind === "signature" ? 3 : ONE_HEART.has(id) ? 1 : 2;
}
export const SKILL_IDS = METHOD_IDS;
export const PRACTICE_SECONDS = 600;
export type Practice = {
  id: string;
  method: MethodId;
  status: "running" | "paused" | "completed" | "cancelled";
  elapsed: number;
  updatedAt: string;
};
export type HeartEntry = {
  id: string;
  amount: number;
  reason: "card" | "unlock" | "refund" | "install" | "practice";
  reference: string;
  createdAt: string;
};
export type SkillProgress = {
  balance: number;
  unlocked: MethodId[];
  practiced: MethodId[];
  installClaimed: boolean;
  entries: HeartEntry[];
  practice: Practice | null;
};
export const EMPTY_SKILLS: SkillProgress = {
  balance: 0,
  unlocked: [],
  practiced: [],
  installClaimed: false,
  entries: [],
  practice: null,
};
export const EFFECT_QUESTIONS: Record<MethodId, string> = {
  "blank-page": "책을 덮고 그려 보니, 기억난 부분과 빈 부분이 구분됐나요?",
  cornell: "단서만 보고 내용을 떠올리는 데 도움이 됐나요?",
  flowchart: "조건부터 풀이까지의 순서가 더 잘 보였나요?",
  feynman: "쉬운 말로 설명하면서 막히는 부분을 찾았나요?",
  "self-quiz": "직접 만든 질문으로 기억을 확인할 수 있었나요?",
  "self-explanation": "왜 그 풀이를 쓰는지 설명할 수 있었나요?",
  "card-sort": "카드를 나누면서 개념 사이의 관계가 보였나요?",
  leitner: "헷갈리는 카드에 더 집중할 수 있었나요?",
  interleaving: "섞인 문제에서 어떤 풀이를 쓸지 구분할 수 있었나요?",
  gesture: "동작을 떠올리니 개념도 함께 생각났나요?",
  "memory-palace": "장소를 떠올리며 내용을 순서대로 기억할 수 있었나요?",
  "spaced-retry": "시간을 두고 다시 풀며 잊었던 부분을 찾았나요?",
  outline: "목차를 만들며 큰 내용과 작은 내용이 연결됐나요?",
  "dual-coding": "그림과 문장을 함께 쓰니 내용이 더 잘 떠올랐나요?",
  timeline: "시간 선에 놓으니 사건의 순서와 연결이 보였나요?",
  compare: "나란히 비교하니 공통점과 차이점이 구분됐나요?",
  sq3r: "읽기 전에 만든 질문에 내 말로 답할 수 있었나요?",
  elaborative: "왜 그런지 생각하며 이미 아는 내용과 연결했나요?",
  "teach-back": "다시 설명하면서 이해하지 못한 부분을 발견했나요?",
  socratic: "근거를 묻는 질문이 생각을 더 분명하게 했나요?",
  "error-note": "틀린 이유를 찾고 다시 풀 때 바꿀 점을 알게 됐나요?",
  variation: "조건을 바꿔도 풀이를 적용할 수 있었나요?",
  jigsaw: "각자 맡은 내용을 합쳐 전체를 이해할 수 있었나요?",
  "problem-posing": "문제를 만들면서 중요한 조건을 발견했나요?",
  distributed: "나누어 복습하니 잊었던 내용을 다시 떠올렸나요?",
  "mini-quiz": "짧은 퀴즈로 지금 아는 것과 모르는 것을 확인했나요?",
  "peer-instruction": "답을 고른 이유를 설명하며 생각이 더 분명해졌나요?",
  "gallery-walk": "다른 정리를 살펴보며 내 정리에 빠진 것을 찾았나요?",
};
