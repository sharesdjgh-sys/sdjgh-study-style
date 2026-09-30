import { CHARACTER_IMAGES } from "./characters";
export const VERSION = "2026-09-v1";
export const MODALITIES = ["visual", "auditory", "tactile", "motion"] as const;
export type Modality = (typeof MODALITIES)[number];
export type Social = "solo" | "team";
export type Pace = "planned" | "flexible";
export type Task = "concept" | "memory" | "problem";
export type Axis = Modality | Social | Pace;
export type Answer = 1 | 2 | 3 | 4 | 5;
export type Answers = Partial<Record<string, Answer>>;
export type Question = { id: string; axis: Axis; text: string; hint: string };
export const QUESTIONS: Question[] = [
  {
    id: "v1",
    axis: "visual",
    text: "개념 사이의 관계를 화살표나 그림으로 정리하는 것을 좋아해요.",
    hint: "마인드맵이나 간단한 관계도를 떠올려 보세요.",
  },
  {
    id: "a1",
    axis: "auditory",
    text: "배운 내용을 소리 내어 제 말로 설명하는 것을 좋아해요.",
    hint: "누군가에게 설명하거나 혼잣말로 정리할 때요.",
  },
  {
    id: "t1",
    axis: "tactile",
    text: "핵심 내용을 작은 카드로 직접 만들어 다루는 것을 좋아해요.",
    hint: "단어 카드나 개념 카드를 만드는 활동이에요.",
  },
  {
    id: "m1",
    axis: "motion",
    text: "공부하는 동안 앉기와 서기처럼 자세를 바꾸는 편을 선호해요.",
    hint: "움직임의 크기나 운동 능력과는 관계없어요.",
  },
  {
    id: "s1",
    axis: "solo",
    text: "배운 내용을 정리할 때 혼자 생각할 시간을 갖는 편이 좋아요.",
    hint: "친구를 좋아하는지보다 공부할 때의 취향을 생각해 보세요.",
  },
  {
    id: "p1",
    axis: "planned",
    text: "공부를 시작하기 전에 오늘 할 순서를 정해두는 편이에요.",
    hint: "아주 짧은 할 일 목록도 괜찮아요.",
  },
  {
    id: "v2",
    axis: "visual",
    text: "비슷한 개념을 비교할 때 표로 나란히 놓아보는 것을 선호해요.",
    hint: "공통점과 차이점을 한눈에 살펴보는 방식이에요.",
  },
  {
    id: "a2",
    axis: "auditory",
    text: "글로 적힌 요약보다 말로 풀어주는 설명을 먼저 듣고 싶어요.",
    hint: "더 잘하는 방법이 아니라 먼저 손이 가는 방법을 골라주세요.",
  },
  {
    id: "t2",
    axis: "tactile",
    text: "종이나 카드를 직접 옮기면서 내용을 분류하는 것을 좋아해요.",
    hint: "비슷한 것끼리 묶거나 순서를 바꾸는 활동이에요.",
  },
  {
    id: "m2",
    axis: "motion",
    text: "외울 내용을 확인할 때 가볍게 움직이면서 해보고 싶어요.",
    hint: "앉아서 몸을 작게 움직이는 것도 포함해요.",
  },
  {
    id: "s2",
    axis: "team",
    text: "배운 내용을 다른 사람과 질문을 주고받으며 정리하는 편이 좋아요.",
    hint: "친구 수나 성격보다 정리하는 방식을 떠올려 보세요.",
  },
  {
    id: "p2",
    axis: "flexible",
    text: "공부할 순서는 그때의 상황에 맞춰 바꾸는 편을 선호해요.",
    hint: "계획이 없는지보다 순서를 유연하게 바꾸는지 생각해 보세요.",
  },
  {
    id: "v3",
    axis: "visual",
    text: "내용을 구분할 때 색이나 배치를 달리하는 것을 좋아해요.",
    hint: "예쁘게 꾸미는 실력은 중요하지 않아요.",
  },
  {
    id: "a3",
    axis: "auditory",
    text: "복습할 때 질문과 답을 말로 주고받는 방식이 끌려요.",
    hint: "혼자 질문을 읽고 답해보는 것도 포함해요.",
  },
  {
    id: "t3",
    axis: "tactile",
    text: "내용을 작은 모형이나 조각으로 직접 구성해보는 것이 끌려요.",
    hint: "종이 조각을 조립하는 간단한 활동도 좋아요.",
  },
  {
    id: "m3",
    axis: "motion",
    text: "한 자세를 오래 유지하기보다 중간에 위치나 자세를 바꾸며 공부하고 싶어요.",
    hint: "편안하게 가능한 범위 안에서 떠올려 주세요.",
  },
];
export const ANSWER_LABELS = [
  "전혀 아니에요",
  "아닌 편이에요",
  "보통이에요",
  "그런 편이에요",
  "매우 그래요",
];
export const FAMILIES = {
  visual: {
    label: "시각형",
    verb: "그려서",
    title: "머릿속에 지도를 그리는",
    name: "지도 설계자",
    icon: "map-linear",
    symbol: "◈",
    summary: "그림과 배치로 생각을 연결하는 편이에요.",
    activity: "기억으로 개념 지도 그리기",
    action: "책을 덮고 핵심 개념 5개를 적은 뒤, 관계를 선으로 연결하세요.",
    detail: "화살표 하나마다 ‘왜 연결되는지’를 설명해 보세요.",
    tags: ["관계도", "비교표", "한눈에 정리"],
    color: "visual",
  },
  auditory: {
    label: "청각형",
    verb: "말해서",
    title: "말하면서 생각을 발견하는",
    name: "이야기 편집자",
    icon: "headphones-round-sound-linear",
    symbol: "≋",
    summary: "말하고 들으면서 생각을 정리하는 편이에요.",
    activity: "책을 덮고 1분 설명하기",
    action:
      "책을 덮고 오늘 배운 개념을 처음 듣는 사람에게 설명하듯 말해보세요.",
    detail: "설명이 막히는 부분은 확인할 내용을 찾았다는 신호예요.",
    tags: ["내 말로 설명", "질문", "소리 내어 복습"],
    color: "auditory",
  },
  tactile: {
    label: "촉각형",
    verb: "만져서",
    title: "손끝으로 생각을 조립하는",
    name: "카드 조합가",
    icon: "layers-linear",
    symbol: "▧",
    summary: "직접 만들고 조작하며 내용을 정리하는 편이에요.",
    activity: "핵심어 카드 연결하기",
    action:
      "책을 덮고 핵심어를 종이 조각에 하나씩 적은 뒤, 관련 있는 것끼리 묶으세요.",
    detail: "카드의 순서를 바꿔보고, 연결한 이유를 설명해 보세요.",
    tags: ["카드", "만들기", "직접 조합"],
    color: "tactile",
  },
  motion: {
    label: "운동형",
    verb: "움직여서",
    title: "작은 움직임으로 리듬을 만드는",
    name: "리듬 탐험가",
    icon: "routing-2-linear",
    symbol: "↝",
    summary: "편한 자세와 움직임에 변화를 주는 편이에요.",
    activity: "자세를 바꾸며 기억 꺼내기",
    action: "편하게 자세를 바꾸고, 책을 덮은 채 핵심 질문 3개에 답해보세요.",
    detail: "앉아서 해도 좋아요. 움직임보다 기억을 꺼내는 과정이 중요해요.",
    tags: ["자세 전환", "나만의 리듬", "짧게 시도"],
    color: "motion",
  },
} as const;
export type StudyType = {
  code: string;
  modality: Modality;
  social: Social;
  pace: Pace;
  name: string;
  subtitle: string;
  asset: string | null;
};
export const SOCIAL_LABELS: Record<Social, string> = {
  solo: "혼자 차분히",
  team: "함께 나누며",
};
export const PACE_LABELS: Record<Pace, string> = {
  planned: "순서를 정해서",
  flexible: "유연하게",
};
const prefixes = {
  "solo-planned": "차분한",
  "solo-flexible": "자유로운",
  "team-planned": "함께하는",
  "team-flexible": "즉흥적인",
};
export const STUDY_TYPES: StudyType[] = MODALITIES.flatMap((modality) =>
  (["solo", "team"] as const).flatMap((social) =>
    (["planned", "flexible"] as const).map((pace) => ({
      code: `${modality}-${social}-${pace}`,
      modality,
      social,
      pace,
      name: `${prefixes[`${social}-${pace}`]} ${FAMILIES[modality].name}`,
      subtitle: `${SOCIAL_LABELS[social]}, ${PACE_LABELS[pace]} ${FAMILIES[modality].verb} 정리해요.`,
      asset: CHARACTER_IMAGES[`${modality}-${social}-${pace}`] ?? null,
    })),
  ),
);
export const getType = (code: string) =>
  STUDY_TYPES.find((type) => type.code === code);
export const TASKS: Record<Task, { label: string; example: string }> = {
  concept: {
    label: "개념 이해",
    example: "오늘 배운 개념 하나를 골라, 원리와 연결 관계를 떠올려 보세요.",
  },
  memory: {
    label: "암기",
    example:
      "외울 용어 5개를 골라 뜻을 가리고 떠올린 뒤, 헷갈린 것만 다시 확인하세요.",
  },
  problem: {
    label: "문제 풀이",
    example:
      "한 번 풀었던 문제의 풀이를 가리고 다시 풀어본 뒤, 판단이 달라진 지점을 확인하세요.",
  },
};
export function stepsFor(modality: Modality, task: Task) {
  return [
    TASKS[task].example,
    FAMILIES[modality].action,
    "책이나 정답을 열어 빠진 부분을 확인하고, 다른 색으로 표시하세요.",
    "다시 책을 덮고 한 번 더 떠올려 보세요. 내일도 짧게 확인하면 좋아요.",
  ];
}
