import { CHARACTER_IMAGES } from "./characters";
// 검사지 설계와 근거: ref/공부캐_검사지_v2.md
export const VERSION = "2026-10-v2";
export const MODALITIES = ["visual", "auditory", "tactile", "motion"] as const;
export type Modality = (typeof MODALITIES)[number];
export type Social = "solo" | "team";
export type Pace = "planned" | "flexible";
export type Task = "concept" | "memory" | "problem";
export type Pole = Social | Pace;
/** 양극형 응답: 1=위 문장에 훨씬, 2=위 문장에 조금 더, 3=아래 문장에 조금 더, 4=아래 문장에 훨씬 */
export type PairAnswer = 1 | 2 | 3 | 4;
/** 상황형은 고른 방식의 키를, 양극형은 1~4를 저장해요. */
export type Answer = Modality | PairAnswer;
export type Answers = Partial<Record<string, Answer>>;
export type SituationQuestion = {
  id: string;
  kind: "situation";
  text: string;
  hint: string;
  /** 화면에 보이는 순서(균형 라틴 방격으로 방식의 위치를 돌려 둠) */
  options: { modality: Modality; text: string }[];
};
export type PairQuestion = {
  id: string;
  kind: "pair";
  axis: "social" | "pace";
  text: string;
  hint: string;
  top: { pole: Pole; text: string };
  bottom: { pole: Pole; text: string };
};
export type Question = SituationQuestion | PairQuestion;
const situation = (
  id: string,
  text: string,
  hint: string,
  options: [Modality, string][],
): SituationQuestion => ({
  id,
  kind: "situation",
  text,
  hint,
  options: options.map(([modality, text]) => ({ modality, text })),
});
const pair = (
  id: string,
  axis: PairQuestion["axis"],
  text: string,
  top: [Pole, string],
  bottom: [Pole, string],
  hint: string,
): PairQuestion => ({
  id,
  kind: "pair",
  axis,
  text,
  hint,
  top: { pole: top[0], text: top[1] },
  bottom: { pole: bottom[0], text: bottom[1] },
});
const SOCIAL_HINT = "친구 대신 가족·선생님·온라인 스터디를 떠올려도 괜찮아요.";
const PACE_HINT =
  "더 바람직해 보이는 쪽 말고, 요즘 실제로 더 자주 하는 쪽을 골라요.";
/** 제시 순서 그대로: 상황형 3 → 혼자/함께 1 → 계획/즉흥 1을 4번 반복한 뒤 양극형 2 */
export const QUESTIONS: Question[] = [
  situation(
    "A01",
    "내일까지 영어 단어 30개를 외워야 해요. 가장 먼저 손이 가는 방법은?",
    "실제로 해 본 방법이 없다면 가장 끌리는 방법을 골라요.",
    [
      ["visual", "뜻이 비슷한 단어끼리 묶어 표로 정리해요"],
      ["auditory", "발음을 듣고 소리 내어 따라 하며 외워요"],
      ["motion", "일어나서 방 안을 천천히 걸어 다니며 외워요"],
      ["tactile", "단어 카드를 만들어 한 장씩 넘기며 외워요"],
    ],
  ),
  situation(
    "A02",
    "세포 분열처럼 여러 단계로 이어지는 과정을 처음 배워요. 가장 먼저 해 보고 싶은 것은?",
    "앉은 채로 하는 작은 몸짓도 괜찮아요.",
    [
      ["auditory", "단계 순서를 말로 차근차근 설명해 봐요"],
      ["tactile", "단계마다 종이 조각에 적어 순서대로 놓아 봐요"],
      ["visual", "단계별 모습을 그림과 화살표로 그려 봐요"],
      ["motion", "각 단계를 손짓·몸짓으로 흉내 내 봐요"],
    ],
  ),
  situation(
    "A03",
    "여러 사건이 원인과 결과로 얽힌 단원을 정리해요. 나라면?",
    "장소 때문에 못 하던 방법이라도 끌리면 골라도 돼요.",
    [
      ["tactile", "사건을 포스트잇에 하나씩 적어 옮기며 이어 봐요"],
      ["motion", "일어서서 서성이며 사건 순서를 떠올려 봐요"],
      ["auditory", "사건의 흐름을 이야기하듯 소리 내어 풀어 봐요"],
      ["visual", "사건들을 연표나 화살표 도식 한 장에 정리해요"],
    ],
  ),
  pair(
    "B-S1",
    "social",
    "새로 배운 내용을 정리할 때",
    ["solo", "새로 배운 내용은 먼저 혼자 곰곰이 정리해요."],
    ["team", "새로 배운 내용은 누군가와 이야기하며 정리해요."],
    SOCIAL_HINT,
  ),
  pair(
    "B-P1",
    "pace",
    "공부를 시작할 때",
    ["planned", "공부를 시작하기 전에 오늘 할 순서와 분량을 정해 둬요."],
    ["flexible", "일단 공부를 시작하고, 하면서 다음에 할 것을 정해요."],
    PACE_HINT,
  ),
  situation(
    "A04",
    "틀린 수학 문제의 풀이를 다시 이해하고 싶어요. 가장 먼저 하는 것은?",
    "더 좋아 보이는 방법보다 먼저 손이 가는 방법을 골라요.",
    [
      ["motion", "자리를 옮기거나 서서 다시 풀어 봐요"],
      ["visual", "조건과 풀이 흐름을 그림·도식으로 그려 봐요"],
      ["tactile", "빈 종이에 풀이를 손으로 처음부터 다시 써 봐요"],
      ["auditory", "왜 그렇게 푸는지 한 줄씩 소리 내어 설명해 봐요"],
    ],
  ),
  situation(
    "A05",
    "어제 배운 내용을 오늘 10분 동안 복습해요. 나라면?",
    "네 방법 모두 ‘보지 않고 떠올리기’예요. 방식만 골라요.",
    [
      ["visual", "빈 종이에 어제 내용을 도식으로 다시 그려 봐요"],
      ["auditory", "어제 내용을 소리 내어 1분 동안 말해 봐요"],
      ["motion", "걸으면서 어제 내용을 하나씩 떠올려 봐요"],
      ["tactile", "핵심어 카드를 섞어 뒤집어 보며 답해 봐요"],
    ],
  ),
  situation(
    "A06",
    "시험 전날 밤, 정리한 내용을 마지막으로 확인해요. 가장 손이 가는 방법은?",
    "실제로 해 본 방법이 없다면 가장 끌리는 방법을 골라요.",
    [
      ["auditory", "핵심 내용을 중얼거리며 소리로 확인해요"],
      ["tactile", "카드나 포스트잇을 섞어 하나씩 뽑아 확인해요"],
      ["visual", "정리한 표와 그림을 훑으며 위치까지 떠올려요"],
      ["motion", "자세를 바꾸거나 걸으며 머릿속으로 떠올려요"],
    ],
  ),
  pair(
    "B-S2",
    "social",
    "막히는 문제가 나오면",
    ["team", "막히는 문제는 친구나 선생님에게 먼저 물어봐요."],
    ["solo", "막히는 문제는 해설이나 자료를 찾아 혼자 먼저 풀어 봐요."],
    SOCIAL_HINT,
  ),
  pair(
    "B-P2",
    "pace",
    "한 과목을 하다 흐름이 막히면",
    ["flexible", "흐름이 막히면 다른 과목으로 바꿔 분위기를 바꿔요."],
    ["planned", "정해 둔 시간까지는 한 과목을 이어서 해요."],
    PACE_HINT,
  ),
  situation(
    "A07",
    "수행평가 발표를 앞두고 연습해요. 가장 먼저 하고 싶은 것은?",
    "발표 경험이 없다면 연습하는 내 모습을 떠올려 보세요.",
    [
      ["tactile", "카드로 나눠 손으로 순서를 바꿔 보며 다듬어요"],
      ["motion", "일어서서 몸짓과 움직임을 맞춰 가며 연습해요"],
      ["auditory", "소리 내어 말해 보며 문장과 말투를 다듬어요"],
      ["visual", "발표 흐름을 그림이나 도식으로 먼저 그려 봐요"],
    ],
  ),
  situation(
    "A08",
    "친구가 내가 아는 개념을 물어봐서 설명해 줘요. 나는 주로…",
    "네 방법 모두 친구와 함께하는 상황이에요. 설명하는 방식만 골라요.",
    [
      ["motion", "손짓·몸짓을 크게 섞어 가며 설명해요"],
      ["visual", "종이에 그림이나 도식을 그려 가며 설명해요"],
      ["tactile", "펜·지우개 같은 물건을 놓고 옮겨 가며 보여 줘요"],
      ["auditory", "예를 들어 가며 말로 차근차근 설명해요"],
    ],
  ),
  situation(
    "A09",
    "공식이나 원소 기호처럼 순서가 있는 것을 외워요. 나라면?",
    "장소 때문에 못 하던 방법이라도 끌리면 골라도 돼요.",
    [
      ["visual", "색과 위치를 정해 한 장의 표로 만들어 외워요"],
      ["auditory", "리듬이나 노래를 붙여 소리 내어 외워요"],
      ["motion", "하나씩 손짓이나 동작을 붙여 몸으로 외워요"],
      ["tactile", "빈 종이에 손으로 여러 번 써 보며 외워요"],
    ],
  ),
  pair(
    "B-S3",
    "social",
    "공부하기 편한 자리는",
    ["solo", "혼자 있는 조용한 자리에서 공부하는 게 편해요."],
    ["team", "친구와 같은 공간에서 각자 공부하는 게 편해요."],
    "스터디카페·캠스터디처럼 말없이 함께하는 것도 포함해요.",
  ),
  pair(
    "B-P3",
    "pace",
    "시험 준비를 시작할 때",
    ["planned", "시험 2~3주 전에 날짜별 공부 계획표를 만들어요."],
    ["flexible", "시험 범위를 확인하고 그날그날 할 것을 정해요."],
    PACE_HINT,
  ),
  situation(
    "A10",
    "전기 회로나 도르래처럼 작동하는 원리를 이해해야 해요. 가장 먼저 하고 싶은 것은?",
    "실험 도구나 모형이 없어도 괜찮아요. 가장 끌리는 방법을 골라요.",
    [
      ["auditory", "원리를 설명하는 말을 들으며 순서를 따라가요"],
      ["tactile", "실제 물건이나 간단한 모형을 만져 보며 확인해요"],
      ["visual", "작동 과정을 그림과 화살표로 그려 봐요"],
      ["motion", "몸을 움직여 작동하는 모습을 흉내 내 봐요"],
    ],
  ),
  situation(
    "A11",
    "오늘 공부할 곳을 마음대로 고를 수 있다면 어디가 끌리나요?",
    "혼자인지 함께인지는 생각하지 말고 공간만 떠올려요.",
    [
      ["tactile", "자료를 넓게 펼쳐 놓고 만질 수 있는 큰 책상"],
      ["motion", "서 있거나 걸어 다녀도 되는 넓은 공간"],
      ["auditory", "소리 내어 읽고 말해도 눈치 보이지 않는 곳"],
      ["visual", "정리한 자료를 벽이나 화면에 붙여 볼 수 있는 곳"],
    ],
  ),
  situation(
    "A12",
    "공부하다 집중이 흐트러졌어요. 다시 시작하려면?",
    "더 좋아 보이는 방법보다 먼저 손이 가는 방법을 골라요.",
    [
      ["motion", "잠깐 일어나 걷거나 몸을 풀고 돌아와요"],
      ["visual", "지금까지 한 내용을 그림 한 장으로 그려 봐요"],
      ["tactile", "핵심어 카드를 손으로 넘겨 보며 다시 시작해요"],
      ["auditory", "방금 공부한 내용을 소리 내어 짧게 말해 봐요"],
    ],
  ),
  pair(
    "B-S4",
    "social",
    "시험 전에 확인할 때",
    ["team", "시험 전에는 친구와 서로 문제를 내 주며 확인해요."],
    ["solo", "시험 전에는 혼자 문제를 풀어 보며 확인해요."],
    SOCIAL_HINT,
  ),
  pair(
    "B-P4",
    "pace",
    "계획이 어긋나면",
    ["flexible", "계획이 어긋나면 그때 상황에 맞춰 순서를 바꿔 이어 가요."],
    ["planned", "계획이 어긋나면 남은 일정을 다시 짜서 그대로 따라가요."],
    PACE_HINT,
  ),
  pair(
    "B-S5",
    "social",
    "정리한 노트는",
    ["solo", "정리한 노트는 주로 나 혼자 보려고 만들어요."],
    ["team", "정리한 내용은 친구와 바꿔 보거나 나누는 게 좋아요."],
    SOCIAL_HINT,
  ),
  pair(
    "B-P5",
    "pace",
    "할 일을 챙길 때",
    ["planned", "할 일을 목록이나 플래너에 적고 하나씩 지워요."],
    ["flexible", "할 일은 머릿속에 두고 그때그때 골라서 해요."],
    PACE_HINT,
  ),
];
export const SITUATIONS = QUESTIONS.filter(
  (q): q is SituationQuestion => q.kind === "situation",
);
export const PAIRS = QUESTIONS.filter(
  (q): q is PairQuestion => q.kind === "pair",
);
/** 문항 형식이 처음 나올 때 보여 주는 안내 */
export const QUESTION_GUIDES: Record<Question["kind"], string> = {
  situation:
    "이럴 때 나라면 어떤 방법에 가장 먼저 손이 갈까요? 하나만 골라 주세요. 해 본 적 없는 상황이면 가장 끌리는 방법을 고르고, 장소 때문에 못 하던 방법이라도 끌리면 골라도 돼요.",
  pair: "두 문장 중 요즘의 나에게 더 가까운 쪽을 골라 주세요. 딱 반반이면 조금이라도 더 자주 그런 쪽으로요.",
};
export function isValidAnswer(q: Question, answer: unknown): answer is Answer {
  return q.kind === "situation"
    ? q.options.some((o) => o.modality === answer)
    : answer === 1 || answer === 2 || answer === 3 || answer === 4;
}
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
    summary: "직접 쓰고 만들고 옮기며 내용을 정리하는 편이에요.",
    activity: "핵심어 카드 연결하기",
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
