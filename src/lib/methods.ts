import type { Modality, Pace, Social, StudyType, Task } from "./content";
// 공부법은 효과가 꾸준히 확인된 원리(인출 연습·간격 반복·교차 연습·자기 설명·정교화 질문 등)를
// 학생이 끌리는 방식으로 실행하도록 짰어요. 근거와 한계는 /about#evidence에 있어요.
// 캐릭터별 공부법 설계: ref/공부캐별_공부법_라인업_제안.md
export const TASKS: Record<Task, { label: string; when: string }> = {
  concept: { label: "개념 이해", when: "원리와 연결을 내 것으로 만들 때" },
  memory: { label: "용어 암기", when: "용어·공식·단어를 정확히 외울 때" },
  problem: {
    label: "문제 풀이",
    when: "풀었던 문제를 다시 풀 수 있게 만들 때",
  },
};
export type MethodCategory = Task | "review";
export const CATEGORIES: Record<MethodCategory, { label: string }> = {
  concept: { label: TASKS.concept.label },
  memory: { label: TASKS.memory.label },
  problem: { label: TASKS.problem.label },
  review: { label: "복습·리듬" },
};
/** 공부법 안에서 실제로 쓰는 원리. basic은 모든 공부캐의 기본기예요. */
export const PRINCIPLES = {
  retrieval: { label: "떠올리기", basic: true },
  spacing: { label: "간격 두기", basic: true },
  explain: { label: "설명하기" },
  why: { label: "왜? 묻기" },
  question: { label: "질문 만들기" },
  organize: { label: "구조 만들기" },
  dual: { label: "그림과 말 함께" },
  contrast: { label: "구분하기" },
  mix: { label: "섞어 풀기" },
  transfer: { label: "바꿔 풀기" },
  generate: { label: "문제 만들기" },
  fix: { label: "틀린 곳 고치기" },
  sound: { label: "소리 내기" },
  gesture: { label: "몸으로 하기" },
  place: { label: "장소에 놓기" },
} as const satisfies Record<string, { label: string; basic?: boolean }>;
export type Principle = keyof typeof PRINCIPLES;
export type Evidence = "strong" | "moderate" | "tool";
export const EVIDENCE: Record<Evidence, { label: string; text: string }> = {
  strong: {
    label: "근거 탄탄",
    text: "여러 연구에서 꾸준히 확인된 원리를 써요.",
  },
  moderate: {
    label: "근거 있음",
    text: "도움이 된다는 연구가 있는 원리를 써요.",
  },
  tool: {
    label: "정리 도구",
    text: "정리를 돕는 도구예요. 떠올리기 단계와 함께 써요.",
  },
};
export type StudyMethod = {
  name: string;
  /** 같은 공부법의 다른 이름(영문명·흔한 별칭) */
  aka: string[];
  oneLine: string;
  principles: Principle[];
  evidence: Evidence;
  category: MethodCategory;
  steps: [string, string, string, string];
  /** 결과에 따라 범위를 넓히거나 줄이는 규칙 */
  level: string;
  /** 함께하는 공부법을 혼자 할 때 */
  alone?: string;
  /** 같이 쓰면 좋은 진행 팁 */
  tip?: { name: string; text: string };
};
export const STUDY_METHODS = {
  // ── 계열 공부법: 같은 방식의 공부캐 4명이 과제별로 함께 써요 ──
  "blank-page": {
    name: "백지 복습법",
    aka: ["블러팅", "백지 개념 지도"],
    oneLine:
      "책을 덮고 빈 종이에 기억나는 걸 모두 꺼낸 뒤, 책과 비교해 빈 곳을 채워요.",
    principles: ["retrieval", "dual"],
    evidence: "strong",
    category: "concept",
    steps: [
      "오늘 배운 단원에서 핵심 개념 5개를 골라요.",
      "책을 덮고 빈 종이에 개념을 배치한 뒤 화살표로 이어요. 화살표 위에는 왜 연결되는지 한두 단어로 적어요.",
      "책을 열어 빠진 개념과 틀린 연결을 다른 색으로 고쳐요.",
      "다시 책을 덮고 같은 지도를 한 번 더 그려요. 고친 곳이 이번엔 떠오르는지 확인해요.",
    ],
    level:
      "막힘없이 그렸다면 다음엔 개념을 2개 더 넣어요. 3개도 떠오르지 않으면 소제목만 보고 뼈대부터 다시 그려요.",
  },
  cornell: {
    name: "코넬 노트",
    aka: ["Cornell Method", "코넬식 가림 복습"],
    oneLine:
      "노트를 단서 칸과 내용 칸으로 나누고, 내용을 가린 채 단서만 보고 떠올려요.",
    principles: ["retrieval", "organize"],
    evidence: "strong",
    category: "memory",
    steps: [
      "외울 용어 5개를 골라요. 노트 왼쪽 좁은 칸에 용어를, 오른쪽 넓은 칸에 뜻과 예시를 적고, 맨 아래에 한 줄 요약을 남겨요.",
      "오른쪽 칸을 종이로 가리고, 왼쪽 용어만 보며 뜻과 예시를 떠올려요.",
      "가린 칸을 열어 맞춰 보고, 틀린 용어에만 색 표시를 해요.",
      "표시한 용어만 다시 가리고 떠올려요. 모두 맞힐 때까지 반복해요.",
    ],
    level:
      "5개를 다 맞히면 10개로 늘리거나 왼쪽 용어 칸을 가려 거꾸로 떠올려요. 절반 넘게 틀리면 3개로 줄여요.",
  },
  flowchart: {
    name: "플로차트 풀이",
    aka: ["풀이 흐름도", "Flowchart"],
    oneLine:
      "풀이를 ‘조건 → 판단 → 계산’ 흐름도로 다시 그리며 왜 그 방법인지 적어요.",
    principles: ["retrieval", "explain"],
    evidence: "moderate",
    category: "problem",
    steps: [
      "한 번 풀었던 문제 하나를 골라 풀이를 가려요.",
      "‘조건 → 판단 → 계산 → 답’을 상자와 화살표로 떠올려 그려요. 판단 상자에는 왜 그 방법을 골랐는지 적어요.",
      "해설과 비교해 판단이 달랐던 상자를 다른 색으로 표시해요.",
      "같은 유형의 다른 문제 하나를 풀이를 보지 않고 풀어 봐요.",
    ],
    level:
      "흐름도가 바로 그려지면 다른 단원 문제 하나를 섞어 어떤 방법을 쓸지부터 골라요. 첫 상자부터 막히면 해설의 흐름을 한 번 따라 그린 뒤 가리고 다시 그려요.",
  },
  feynman: {
    name: "파인만 학습법",
    aka: ["Feynman Technique", "1분 설명하기"],
    oneLine:
      "처음 듣는 사람에게 설명하듯 쉬운 말로 풀어 보고, 막히는 곳을 다시 공부해요.",
    principles: ["retrieval", "explain"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "오늘 배운 개념 하나를 골라요.",
      "책을 덮고 처음 듣는 친구에게 말하듯 1분 동안 소리 내어 설명해요. 어려운 용어는 쉬운 말로 바꿔요.",
      "설명이 막히거나 얼버무린 곳을 기억해 두고, 책을 열어 그 부분을 확인해요.",
      "막혔던 문장부터 다시 1분 설명해요. 처음보다 매끄러워졌는지 들어 봐요.",
    ],
    level:
      "1분을 막힘없이 채웠다면 예외나 다른 예를 묻는 질문을 하나 더 해요. 30초도 어려우면 핵심 문장 세 개만 정해 그것부터 말해요.",
  },
  "self-quiz": {
    name: "셀프 퀴즈",
    aka: ["Self-Quizzing", "소리 내어 묻고 답하기"],
    oneLine: "외울 내용을 질문으로 바꿔 스스로 묻고 소리 내어 답해요.",
    principles: ["retrieval", "sound"],
    evidence: "strong",
    category: "memory",
    steps: [
      "외울 용어 5개를 질문으로 바꿔요. 예: “광합성이 일어나는 곳은?”",
      "답을 가리고 질문을 소리 내어 읽은 뒤, 답도 소리 내어 말해요.",
      "답을 열어 확인하고, 틀린 질문에만 표시해요.",
      "표시한 질문만 다시 소리 내어 묻고 답해요.",
    ],
    level:
      "5개를 다 맞히면 순서를 섞거나 답을 보고 질문을 떠올리는 거꾸로 묻기를 해요. 절반 넘게 틀리면 3개로 줄여요.",
  },
  "self-explanation": {
    name: "자기 설명법",
    aka: ["Self-Explanation", "이유 말하며 다시 풀기"],
    oneLine:
      "풀이 단계마다 “여기서는 왜 이렇게 하지?”를 스스로 설명하며 다시 풀어요.",
    principles: ["explain", "retrieval"],
    evidence: "moderate",
    category: "problem",
    steps: [
      "한 번 풀었던 문제 하나를 골라 풀이를 가려요.",
      "다시 풀면서 단계마다 “여기서는 ○○라서 이렇게 해”처럼 이유를 소리 내어 말해요.",
      "해설과 비교해 이유를 말하지 못했거나 판단이 달랐던 단계를 표시해요.",
      "표시한 단계의 이유를 한 문장으로 말한 뒤, 같은 유형의 다른 문제를 풀어 봐요.",
    ],
    level:
      "이유까지 막힘없이 말했다면 다른 유형 문제를 섞어 ‘이 문제엔 어떤 방법?’부터 말해요. 첫 단계부터 막히면 해설을 한 단계씩 소리 내어 읽은 뒤 다시 가려요.",
  },
  "card-sort": {
    name: "카드 분류법",
    aka: ["카드 소팅", "개념 카드 분류"],
    oneLine: "핵심어 카드를 기준에 따라 묶어 보며 개념 사이의 관계를 떠올려요.",
    principles: ["retrieval", "organize", "explain"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "오늘 배운 핵심어 6~8개를 작은 종이에 하나씩 적어요.",
      "책을 덮고 원인과 결과, 공통점, 순서처럼 기준을 정해 카드를 묶어요. 묶은 이유를 짧게 적어요.",
      "책을 열어 잘못 묶은 카드와 빠진 연결을 확인해요.",
      "카드를 섞고 기준을 바꿔 한 번 더 묶어요.",
    ],
    level:
      "막힘없이 묶였다면 다른 단원 카드 2장을 섞어 넣어요. 6장도 어렵다면 4장으로 줄여 두 묶음부터 만들어요.",
  },
  leitner: {
    name: "라이트너 시스템",
    aka: ["Leitner System", "카드 상자 복습", "플래시카드"],
    oneLine:
      "맞힌 카드는 점점 드물게, 틀린 카드는 자주 보도록 상자를 나눠 복습해요.",
    principles: ["retrieval", "spacing"],
    evidence: "strong",
    category: "memory",
    steps: [
      "앞면에 질문, 뒷면에 답을 쓴 카드를 5~10장 만들어요.",
      "앞면만 보고 답을 떠올린 뒤 뒤집어 확인해요. 맞힌 카드는 ‘내일’ 더미, 틀린 카드는 ‘오늘 한 번 더’ 더미에 놓아요.",
      "‘오늘 한 번 더’ 더미를 섞어 모두 맞힐 때까지 반복해요.",
      "내일은 ‘내일’ 더미부터 꺼내요. 또 맞히면 ‘3일 뒤’ 더미로 옮겨요.",
    ],
    level:
      "처음부터 거의 다 맞히면 카드를 뒤집어 답을 보고 질문을 떠올려요. 절반 넘게 틀리면 카드를 5장으로 줄여요.",
  },
  interleaving: {
    name: "인터리빙",
    aka: ["교차 연습", "Interleaving", "섞어 풀기"],
    oneLine: "여러 유형의 문제를 섞어 풀며 ‘어떤 방법을 쓸지’부터 골라요.",
    principles: ["mix", "retrieval"],
    evidence: "moderate",
    category: "problem",
    steps: [
      "서로 다른 유형의 문제 3~4개를 골라 종이 카드에 하나씩 적어요. 문제 번호만 적어도 돼요.",
      "카드를 섞어 한 장 뽑고, 풀기 전에 어떤 방법을 쓸지 먼저 적어요.",
      "풀고 해설로 확인해요. 방법을 잘못 고른 카드는 따로 빼 둬요.",
      "따로 뺀 카드만 다시 섞어 방법 고르기부터 다시 해요.",
    ],
    level:
      "방법을 모두 맞게 골랐다면 다른 단원 문제 카드를 한 장 더 섞어요. 계속 헷갈리면 유형을 2개로 줄여 둘의 차이부터 비교해요.",
  },
  gesture: {
    name: "제스처 학습",
    aka: ["동작 효과", "몸으로 과정 따라가기"],
    oneLine: "과정의 단계마다 손짓·동작을 붙여 몸으로 따라 하며 떠올려요.",
    principles: ["gesture", "retrieval"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "오늘 배운 과정이나 흐름을 3~5단계로 나눠요.",
      "단계마다 손짓이나 동작, 서 있을 자리를 하나씩 정해요.",
      "책을 덮고 동작을 하며 단계를 차례로 떠올린 뒤, 책을 열어 빠진 단계를 확인해요.",
      "빠진 단계에 동작을 다시 붙이고 처음부터 한 번 더 해요.",
    ],
    level:
      "막힘없이 이어지면 마지막 단계부터 거꾸로 해 봐요. 3단계도 이어지지 않으면 2단계씩 끊어서 해요.",
  },
  "memory-palace": {
    name: "기억의 궁전",
    aka: ["장소법", "Method of Loci", "기억 길"],
    oneLine:
      "익숙한 장소의 위치마다 외울 것을 놓아 두고, 그 길을 따라 떠올려요.",
    principles: ["place", "retrieval"],
    evidence: "moderate",
    category: "memory",
    steps: [
      "외울 것 5개를 고르고, 방이나 복도의 위치 5곳(문, 책상, 창문 등)에 하나씩 놓는다고 정해요.",
      "책을 덮고 천천히 걸으며 위치마다 멈춰 그 자리에 둔 내용을 떠올려요.",
      "책을 열어 확인하고, 떠오르지 않은 위치를 기억해 둬요.",
      "떠오르지 않은 위치부터 다시 걸으며 떠올려요. 움직이기 어려우면 앉은 채 위치를 차례로 떠올려도 돼요.",
    ],
    level:
      "5개를 다 떠올렸다면 위치를 7곳으로 늘리거나 거꾸로 걸어요. 절반 넘게 막히면 3곳으로 줄여요.",
  },
  "spaced-retry": {
    name: "간격 두고 다시 풀기",
    aka: ["간격 인출", "Spaced Retrieval", "자리 바꿔 다시 풀기"],
    oneLine:
      "푼 문제를 잠깐 쉬었다가 다시 풀고, 하루 뒤에 풀이 없이 한 번 더 풀어요.",
    principles: ["retrieval", "spacing"],
    evidence: "strong",
    category: "problem",
    steps: [
      "문제 하나를 풀고 해설로 확인해요.",
      "일어나 자리나 자세를 바꾸고 1~2분 몸을 풀어요.",
      "돌아와 풀이를 가리고 같은 문제를 처음부터 다시 풀어요. 해설과 비교해 이번에도 다른 판단에 표시해요.",
      "내일 같은 문제를 풀이 없이 한 번 더 풀어요. 표시한 판단이 이번엔 맞았는지 확인해요.",
    ],
    level:
      "다시 풀 때 막힘이 없다면 같은 유형의 다른 문제 하나를 내일 함께 풀어요. 두 번째도 막히면 해설을 한 단계씩 따라가 본 뒤 다시 가리고 풀어요.",
  },
  // ── 시그니처 공부법: 공부캐마다 하나씩, 혼자/함께 × 계획/즉흥 성향을 담았어요 ──
  outline: {
    name: "목차 공부법",
    aka: ["아웃라인 학습", "목차 백지 쓰기"],
    oneLine:
      "단원의 목차(큰 틀)를 먼저 떠올려 쓰고, 그 아래를 한 칸씩 채워 가요.",
    principles: ["retrieval", "organize", "spacing"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "단원의 대단원 → 중단원 → 소제목을 보고, 빈 종이에 뼈대만 옮겨 써요.",
      "책을 덮고 소제목마다 핵심 내용을 한 줄씩 떠올려 채워요.",
      "책을 열어 빈칸과 틀린 곳을 다른 색으로 채워요.",
      "내일은 목차 뼈대부터 빈 종이에 다시 써 보고, 그 아래를 채워요.",
    ],
    level:
      "목차가 다 떠오르면 소제목 아래 세부 내용을 두 개씩 늘려요. 목차부터 막히면 중단원까지만 써요.",
  },
  "dual-coding": {
    name: "듀얼 코딩",
    aka: ["Dual Coding", "그림+글 노트", "스케치노트"],
    oneLine:
      "같은 내용을 글과 간단한 그림으로 함께 정리하고, 한쪽만 보고 다른 쪽을 떠올려요.",
    principles: ["dual", "retrieval"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "오늘 가장 궁금한 개념 하나를 골라 핵심을 한 문장으로 써요.",
      "문장 옆에 뜻이 보이는 간단한 그림이나 기호를 그려요. 예쁘게 말고 30초 안에요.",
      "문장을 가리고 그림만 보며 설명을 떠올려요. 다음엔 그림을 가리고 문장만 보며 그림을 다시 그려요.",
      "책으로 확인해 틀린 곳을 고치고, 이어지는 개념 하나를 같은 방식으로 붙여요.",
    ],
    level:
      "쉬우면 개념 3개를 한 장에 이어 그려요. 그림이 안 떠오르면 화살표·동그라미 같은 기호만 써요.",
  },
  timeline: {
    name: "타임라인 학습법",
    aka: ["Timeline", "연표 정리"],
    oneLine:
      "사건이나 단계를 시간 순서의 선 위에 놓고, 원인과 결과를 이어 봐요.",
    principles: ["organize", "retrieval", "explain"],
    evidence: "tool",
    category: "concept",
    steps: [
      "세포 분열 단계나 근대사 사건처럼 순서가 있는 내용을 골라, 친구와 구간을 나눠 맡아요.",
      "각자 책을 덮고 맡은 구간을 시간 선 위에 떠올려 적어요.",
      "구간을 이어 붙이며 “이 일 때문에 다음 일이 일어났어”처럼 연결을 서로 설명해요.",
      "책으로 확인해 틀린 순서를 고치고, 처음부터 끝까지 함께 한 번 말해 봐요.",
    ],
    level:
      "쉬우면 사건마다 원인 하나씩 더 붙여요. 순서부터 헷갈리면 사건을 4개까지만 놓아요.",
    alone:
      "구간을 모두 내가 맡되, 구간 하나씩 책을 덮고 떠올려 시간 선에 붙여요.",
  },
  compare: {
    name: "비교·대조 학습",
    aka: ["Compare & Contrast", "벤다이어그램 비교"],
    oneLine: "헷갈리는 두 개념의 공통점과 결정적 차이를 나란히 놓고 찾아요.",
    principles: ["contrast", "retrieval", "dual"],
    evidence: "moderate",
    category: "memory",
    steps: [
      "자꾸 헷갈리는 두 개념을 골라요. 예: 감수 분열과 체세포 분열.",
      "각자 책을 덮고 겹친 원 두 개를 그려, 공통점은 겹친 곳에, 차이는 양쪽에 적어요.",
      "그림을 서로 바꿔 보고, 다르게 적은 곳을 찾아 책으로 확인해요.",
      "두 개념에 해당하는 예시를 하나씩, ‘헷갈리기 쉽지만 아닌 예’를 하나 더 붙여요.",
    ],
    level:
      "쉬우면 세 번째 닮은꼴 개념을 넣어요. 차이가 안 떠오르면 결정적 차이 하나부터 찾아요.",
    alone: "3단계에서 친구 대신 교과서의 표나 그림과 비교해요.",
  },
  sq3r: {
    name: "SQ3R 독서법",
    aka: ["SQ3R", "훑기·질문·읽기·암송·복습"],
    oneLine: "훑기 → 질문 → 읽기 → 암송 → 복습 순서로 교과서를 읽어요.",
    principles: ["retrieval", "question"],
    evidence: "tool",
    category: "concept",
    steps: [
      "훑기·질문: 제목·소제목·그림만 1분 훑고, 소제목을 질문으로 바꿔요. 예: ‘산업 혁명의 배경’ → “산업 혁명은 왜 영국에서 시작됐을까?”",
      "읽기: 질문의 답을 찾는다는 생각으로 읽어요. 밑줄은 긋지 않아요.",
      "암송: 책을 덮고 질문마다 소리 내어 답해요.",
      "복습: 막힌 질문의 부분만 다시 읽고, 덮은 채 다시 답해요. 내일은 질문만 보고 답하기부터 해요.",
    ],
    level:
      "다 답하면 “그래서 어떻게 됐을까?” 같은 이어지는 질문을 하나 더 해요. 질문 셋 중 둘 넘게 막히면 소단원 하나씩 읽고 바로 답해요.",
  },
  elaborative: {
    name: "정교화 질문법",
    aka: ["Elaborative Interrogation", "‘왜?’ 질문법"],
    oneLine: "배운 사실마다 “왜 그럴까?”를 붙여 이유를 스스로 답해 봐요.",
    principles: ["why", "retrieval"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "오늘 배운 사실 3개를 골라요. 예: “식물은 주로 잎에서 광합성을 해요.”",
      "사실마다 “왜 그럴까?”를 붙여, 책을 덮고 혼잣말로 답해요.",
      "책을 열어 내 답이 맞는지, 근거가 있는지 확인해요.",
      "확인한 이유를 넣어 다시 말해요. “~이기 때문에 ~해요.”",
    ],
    level:
      "쉬우면 “그럼 ~라면 어떻게 될까?”를 하나 더 물어요. 이유가 하나도 안 떠오르면 사실을 하나로 줄이고, 교과서에서 이유 문장을 찾아 읽은 뒤 덮고 말해요.",
  },
  "teach-back": {
    name: "티치백",
    aka: ["Teach-Back", "가르치며 배우기"],
    oneLine:
      "친구에게 가르치고, 들은 사람이 자기 말로 다시 설명하며 서로 확인해요.",
    principles: ["explain", "retrieval"],
    evidence: "moderate",
    category: "concept",
    steps: [
      "친구와 공부할 범위를 반씩 나눠요.",
      "3분 동안 각자 ‘가르칠 준비’를 하며 공부해요.",
      "책을 덮고 내 부분을 2분 동안 가르쳐요. 듣는 사람은 들은 내용을 자기 말로 다시 설명해 줘요.",
      "엇갈린 부분을 책으로 확인하고 역할을 바꿔요.",
    ],
    level:
      "쉬우면 듣는 사람이 예시를 하나 더 요청해요. 2분을 못 채우면 핵심 문장 세 개만 가르쳐요.",
    alone:
      "가르칠 대상(동생, 처음 배우는 친구)을 정해 2분 동안 설명한 뒤, 책과 비교해 빠진 곳을 확인해요.",
  },
  socratic: {
    name: "소크라테스식 질문법",
    aka: ["Socratic Questioning", "질문 릴레이"],
    oneLine:
      "“근거는?”, “예외는?”, “만약 ~라면?”을 주고받으며 생각을 깊게 해요.",
    principles: ["question", "why", "retrieval"],
    evidence: "tool",
    category: "concept",
    steps: [
      "친구와 개념 하나를 골라요.",
      "한 사람이 책을 덮고 설명하면, 다른 사람이 ‘근거는?’, ‘예외는?’, ‘만약 ~라면?’ 중 하나로 질문해요.",
      "답하지 못한 질문은 적어 두고, 책에서 함께 찾아요.",
      "역할을 바꾸고, 마지막에 각자 ‘오늘의 발견’을 한 문장으로 남겨요.",
    ],
    level:
      "쉬우면 질문을 두 번 이어서 해요(“그럼 그건 왜?”). 첫 설명부터 막히면 파인만 학습법으로 설명부터 다듬어요.",
    alone:
      "질문 카드 세 장(근거·예외·만약)을 만들어 한 장씩 뽑고 혼잣말로 답해요.",
  },
  "error-note": {
    name: "오답노트",
    aka: ["Error Notebook", "오답 다시 풀기"],
    oneLine:
      "틀린 문제와 틀린 이유를 모아 두고, 며칠 뒤 풀이 없이 다시 풀어 봐요.",
    principles: ["fix", "retrieval", "spacing"],
    evidence: "moderate",
    category: "problem",
    steps: [
      "틀린 문제를 옮겨 적거나 붙여요. 해설은 옮겨 쓰지 않아요.",
      "틀린 이유를 하나 골라 적어요: 개념을 몰랐어요 / 조건을 놓쳤어요 / 계산·옮겨 쓰기 / 문제를 잘못 읽었어요.",
      "다시 틀리지 않으려면 기억할 원리를 한 줄로 적고, 해설을 덮어요.",
      "3일 뒤 문제만 보고 다시 풀어요. 맞히면 ✓ 하나, 두 번 맞히면 그 문제는 졸업이에요.",
    ],
    level:
      "졸업한 문제가 쌓이면 같은 이유로 틀리기 쉬운 새 문제를 하나 더해요. 이유를 고르기 어려우면 해설과 내 풀이를 나란히 두고 처음 달라진 줄을 찾아요.",
    tip: {
      name: "흔한 함정",
      text: "예쁘게 옮겨 쓰는 데 시간을 다 쓰기 쉬워요. 핵심은 4단계의 다시 풀기예요.",
    },
  },
  variation: {
    name: "문제 변형 학습",
    aka: ["Problem Variation", "What-if 문제"],
    oneLine: "풀 줄 아는 문제의 숫자·조건을 바꿔 새 문제를 만들어 풀어 봐요.",
    principles: ["transfer", "retrieval", "generate"],
    evidence: "moderate",
    category: "problem",
    steps: [
      "이제 풀 수 있게 된 문제 하나를 골라요.",
      "숫자·조건·상황 중 하나를 바꿔 새 문제를 만들어요. 예: “만약 속력이 두 배라면?”",
      "바꾼 문제를 풀이를 보지 않고 풀고, 답이 원래 문제와 어떻게 달라졌는지 비교해요.",
      "해설이나 교과서로 원리를 확인하고, 다른 조건 하나를 또 바꿔 봐요.",
    ],
    level:
      "쉬우면 답을 먼저 정하고 그 답이 나오는 문제를 만들어요. 바꾼 문제가 안 풀리면 원래 문제를 먼저 풀이 없이 다시 풀어요.",
  },
  jigsaw: {
    name: "직소 학습법",
    aka: ["Jigsaw", "조각 맞추기 학습"],
    oneLine: "범위를 조각으로 나눠 맡아 공부한 뒤, 서로 가르쳐 전체를 맞춰요.",
    principles: ["explain", "retrieval"],
    evidence: "tool",
    category: "concept",
    steps: [
      "공부할 범위를 사람 수만큼 조각으로 나눠 하나씩 맡아요.",
      "각자 맡은 조각을 공부하고, 책을 덮고 핵심을 카드 3장에 적어요.",
      "모여서 카드 순서대로 내 조각을 설명해요.",
      "조각을 다 맞춘 뒤, 각자 남의 조각 하나를 골라 다시 설명해 봐요.",
    ],
    level:
      "쉬우면 조각 사이의 연결을 하나씩 설명에 넣어요. 카드 3장이 안 채워지면 조각을 더 작게 나눠요.",
    alone:
      "범위를 날짜별 조각으로 나눠 하루 한 조각씩 하고, 마지막 날 모든 조각을 이어 설명해요.",
  },
  "problem-posing": {
    name: "문제 만들기",
    aka: ["Problem Posing", "서로 문제 내기"],
    oneLine: "배운 내용으로 직접 문제를 만들고 친구와 바꿔 풀어요.",
    principles: ["generate", "retrieval"],
    evidence: "moderate",
    category: "review",
    steps: [
      "각자 오늘 배운 내용으로 문제 카드 3장을 만들어요. 뒷면엔 답을 적어요.",
      "카드를 바꿔 책을 덮고 풀어요.",
      "틀린 카드는 만든 사람이 힌트를 하나 주고 다시 풀어요.",
      "가장 좋았던 문제를 하나 골라 왜 좋은지 이야기해요.",
    ],
    level:
      "쉬우면 ‘헷갈리기 쉬운 오답 보기’가 있는 문제를 만들어요. 문제가 안 떠오르면 교과서 문제의 숫자나 단어만 바꿔요.",
    alone:
      "‘일주일 뒤의 나’가 풀 문제 3개를 만들어 두고, 일주일 뒤에 책을 덮고 풀어요.",
  },
  distributed: {
    name: "분산 학습",
    aka: ["Distributed Practice", "구간 나눠 공부하기"],
    oneLine:
      "한 번에 몰아서 하지 않고, 여러 날에 걸쳐 짧은 구간으로 나눠 공부해요.",
    principles: ["spacing", "retrieval"],
    evidence: "strong",
    category: "review",
    steps: [
      "이번 주에 공부할 범위를 세 구간으로 나눠요.",
      "오늘은 첫 구간을 10분 공부하고, 끝나기 전에 책을 덮고 질문 3개에 답해요.",
      "내일은 두 번째 구간을 10분 공부하고, 어제 질문 3개에 다시 답해요.",
      "셋째 날은 세 번째 구간을 공부하고, 앞의 두 구간 질문에도 다시 답해요.",
    ],
    level:
      "쉬우면 구간 사이를 하루에서 이틀로 늘려요. 질문에 답이 잘 안 나오면 구간을 더 짧게 나눠요.",
    tip: {
      name: "포모도로",
      text: "한 구간이 길어지면 25분 공부하고 5분 쉬어요. 쉬는 때를 미리 정해 두면 흐름이 덜 끊겨요.",
    },
  },
  "mini-quiz": {
    name: "미니 퀴즈",
    aka: ["Low-Stakes Quizzing", "저위험 퀴즈"],
    oneLine: "공부 중간중간 부담 없는 퀴즈 3문제로 떠올려 보고 다시 시작해요.",
    principles: ["retrieval"],
    evidence: "strong",
    category: "review",
    steps: [
      "공부하다 지루하거나 막히면, 방금 공부한 내용으로 문제 3개를 떠올려 적어요.",
      "자세를 편하게 바꾸고, 책을 덮은 채 답해요.",
      "책으로 확인하고, 틀린 것 하나만 표시해요.",
      "표시한 문제에 다시 답하고 공부를 이어 가요. 점수는 매기지 않아요.",
    ],
    level:
      "3문제를 다 맞히면 지난주 내용 문제를 하나 섞어요. 문제가 안 떠오르면 소제목을 질문으로 바꾸기만 해도 돼요.",
    tip: {
      name: "2분 규칙",
      text: "시작이 어려울 땐 2분 안에 끝나는 일 하나(카드 한 장 뒤집기)부터 해요.",
    },
  },
  "peer-instruction": {
    name: "피어 인스트럭션",
    aka: ["Peer Instruction", "각자 답하고 토론하기"],
    oneLine: "각자 먼저 답을 고른 뒤, 친구와 이유를 토론하고 다시 답해요.",
    principles: ["retrieval", "explain"],
    evidence: "moderate",
    category: "problem",
    steps: [
      "친구와 함께 풀 문제나 개념 질문 3개를 골라요.",
      "각자 혼자 답을 고르고, 이유를 한 줄 적어요.",
      "답을 공개해 다르면 서로 이유를 설명하고, 다시 답을 골라요.",
      "해설로 확인하고, 처음 답과 바뀐 답 중 어느 쪽이 맞았는지 이야기해요.",
    ],
    level:
      "셋 다 같은 답이 나오면 더 어려운 문제로 바꿔요. 둘 다 이유를 못 쓰면 개념부터 확인하고 와요.",
    alone:
      "답을 고른 뒤 ‘확신해요 / 반반 / 찍었어요’를 표시하고 해설로 확인해요. 찍었는데 맞힌 문제도 다시 봐요.",
  },
  "gallery-walk": {
    name: "갤러리 워크",
    aka: ["Gallery Walk", "돌아다니며 더하기"],
    oneLine:
      "각자 정리한 종이를 붙여 두고 돌아다니며 서로의 정리에 빠진 것을 더해 줘요.",
    principles: ["retrieval", "fix"],
    evidence: "tool",
    category: "review",
    steps: [
      "각자 책을 덮고 오늘 배운 내용을 종이 한 장에 정리해요.",
      "종이를 책상이나 벽에 붙이고, 자리를 옮겨 다니며 친구의 정리를 봐요.",
      "다른 사람 종이에 빠진 내용이나 질문을 포스트잇으로 하나씩 붙여요.",
      "내 자리로 돌아와 받은 포스트잇을 책으로 확인하고 정리를 고쳐요.",
    ],
    level:
      "쉬우면 포스트잇에 질문을 하나씩 더 붙여요. 정리가 반도 안 채워지면 한 소단원만 정리해요.",
    alone:
      "며칠 동안 정리한 종이를 방 곳곳에 두고 돌며, 종이마다 빠진 것을 하나씩 떠올려 더해요.",
  },
} satisfies Record<string, StudyMethod>;
export type MethodId = keyof typeof STUDY_METHODS;
export const METHOD_IDS = Object.keys(STUDY_METHODS) as MethodId[];
export const getMethod = (id: MethodId): StudyMethod => STUDY_METHODS[id];
export const isMethodId = (id: unknown): id is MethodId =>
  typeof id === "string" && Object.hasOwn(STUDY_METHODS, id);
/** 방식별로 과제마다 쓰는 계열 공부법 */
export const FAMILY_METHODS: Record<Modality, Record<Task, MethodId>> = {
  visual: { concept: "blank-page", memory: "cornell", problem: "flowchart" },
  auditory: {
    concept: "feynman",
    memory: "self-quiz",
    problem: "self-explanation",
  },
  tactile: { concept: "card-sort", memory: "leitner", problem: "interleaving" },
  motion: {
    concept: "gesture",
    memory: "memory-palace",
    problem: "spaced-retry",
  },
};
/** 유형 코드별 시그니처 공부법(캐릭터마다 하나씩) */
export const SIGNATURE_METHODS: Record<string, MethodId> = {
  "visual-solo-planned": "outline",
  "visual-solo-flexible": "dual-coding",
  "visual-team-planned": "timeline",
  "visual-team-flexible": "compare",
  "auditory-solo-planned": "sq3r",
  "auditory-solo-flexible": "elaborative",
  "auditory-team-planned": "teach-back",
  "auditory-team-flexible": "socratic",
  "tactile-solo-planned": "error-note",
  "tactile-solo-flexible": "variation",
  "tactile-team-planned": "jigsaw",
  "tactile-team-flexible": "problem-posing",
  "motion-solo-planned": "distributed",
  "motion-solo-flexible": "mini-quiz",
  "motion-team-planned": "peer-instruction",
  "motion-team-flexible": "gallery-walk",
};
/** 혼자/함께, 계획/즉흥에 따라 같은 공부법을 진행하는 이름 있는 방법 */
export const ROUTINES: {
  social: Record<Social, { title: string; text: string }>;
  pace: Record<Pace, { title: string; text: string }>;
} = {
  social: {
    solo: {
      title: "러버덕 설명법",
      text: "막힌 부분은 인형이나 펜에게 처음부터 소리 내어 설명해 봐요. 설명하다 보면 어디서 막히는지 보여요. 그래도 끝까지 막힌 질문 하나만 선생님이나 친구에게 물어보세요.",
    },
    team: {
      title: "생각-짝-나누기",
      text: "같이 하더라도 처음 2분은 각자 조용히 떠올려요. 처음부터 함께 떠올리면 서로의 기억을 따라가느라 덜 떠오르기 쉬워요. 그다음 짝과 비교하고 서로 빠진 것을 질문해요.",
    },
  },
  pace: {
    planned: {
      title: "간격 반복 일정",
      text: "오늘 한 활동을 내일, 3일 뒤, 1주 뒤에 5분씩 다시 해요. 플래너에 ‘언제, 어디서, 무엇을’까지 적어 두면 시작하기 쉬워요.",
    },
    flexible: {
      title: "누적 복습",
      text: "시작은 지금 끌리는 내용으로 해도 좋아요. 대신 끝내기 전에 며칠 전 공부한 다른 내용 하나를 섞어 떠올려요. 그러면 간격과 섞기가 저절로 생겨요.",
    },
  },
};
/** 공부캐 한 명의 공부법: 시그니처 1 + 과제별 3 + 진행 팁 2 */
export function lineupFor(type: StudyType) {
  return {
    signature: SIGNATURE_METHODS[type.code],
    byTask: (Object.keys(TASKS) as Task[]).map((task) => ({
      task,
      method: FAMILY_METHODS[type.modality][task],
    })),
    tips: [ROUTINES.social[type.social], ROUTINES.pace[type.pace]],
  };
}
/** 이 공부법을 즐겨 쓰는 공부캐: 계열 공부법이면 방식, 시그니처면 유형 코드 */
export function methodOwner(
  id: MethodId,
):
  { kind: "family"; modality: Modality } | { kind: "signature"; code: string } {
  const code = Object.keys(SIGNATURE_METHODS).find(
    (key) => SIGNATURE_METHODS[key] === id,
  );
  if (code) return { kind: "signature", code };
  const modality = (Object.keys(FAMILY_METHODS) as Modality[]).find((m) =>
    Object.values(FAMILY_METHODS[m]).includes(id),
  )!;
  return { kind: "family", modality };
}
/** 기존 공부캐 라인업의 방식 분류. 학습 능력이나 효과를 판정하는 등급은 아니에요. */
export function methodModality(id: MethodId): Modality {
  const owner = methodOwner(id);
  return owner.kind === "family"
    ? owner.modality
    : (owner.code.split("-")[0] as Modality);
}
/** 저장된 활동 기록에서 공부법을 찾아요. 예전 기록은 방식·과제로 저장돼 있어요. */
export function missionMethod(mission: {
  method?: string;
  modality?: Modality;
  task?: Task;
}): MethodId | undefined {
  if (isMethodId(mission.method)) return mission.method;
  if (mission.modality && mission.task)
    return FAMILY_METHODS[mission.modality][mission.task];
  return undefined;
}
