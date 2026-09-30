export type Character = {
  number: string;
  name: string;
  species: string;
  line: string;
  intro: string;
  habit: string;
  action: string;
  tags: string[];
};
export const CHARACTERS: Record<string, Character> = {
  "visual-solo-planned": {
    number: "01",
    name: "루미",
    species: "부엉이",
    line: "복잡한 생각도, 한 장의 지도로.",
    intro:
      "조용히 노트를 펼치면 흩어진 생각들이 제자리를 찾아. 큰 그림을 그린 다음, 한 칸씩 채워가는 시간이 좋아.",
    habit: "혼자 개념을 연결하고, 정해둔 순서대로 확인해요.",
    action: "책을 덮고 핵심 개념 3개를 화살표로 연결해봐요.",
    tags: ["생각의 지도", "차분한 집중", "작은 계획"],
  },
  "visual-solo-flexible": {
    number: "02",
    name: "모아",
    species: "여우",
    line: "이 생각, 저 생각. 이어보면 발견!",
    intro:
      "노트의 빈칸은 새로운 길이 시작되는 곳이야. 궁금한 개념부터 그리다 보면, 나만의 연결이 하나씩 생기거든.",
    habit: "혼자 그림을 펼쳐놓고, 끌리는 개념부터 탐색해요.",
    action: "오늘 가장 궁금한 개념 하나에서 연결선을 뻗어봐요.",
    tags: ["자유로운 연결", "혼자 탐색", "낙서의 발견"],
  },
  "visual-team-planned": {
    number: "03",
    name: "루트",
    species: "사슴",
    line: "우리 생각을 한눈에 펼쳐볼까?",
    intro:
      "서로 다른 생각도 한 장에 그리면 어디서 만나는지 보여. 먼저 길을 정하고 친구들과 빈칸을 채워가는 게 좋아.",
    habit: "함께 개념 지도를 만들고, 설명할 순서를 정해요.",
    action: "친구와 개념 3개를 나눠 그리고 연결 이유를 설명해봐요.",
    tags: ["함께 그리기", "연결의 안내자", "순서 있는 대화"],
  },
  "visual-team-flexible": {
    number: "04",
    name: "피코",
    species: "카멜레온",
    line: "다르게 보면, 새롭게 연결돼!",
    intro:
      "친구가 던진 한마디에 그림의 방향이 바뀌는 순간이 재밌어. 색도 배치도 바꿔보면서 새로운 관점을 찾아보자.",
    habit: "생각을 주고받으며 그림과 배치를 자유롭게 바꿔요.",
    action: "같은 개념을 친구와 다르게 그려보고 차이를 찾아봐요.",
    tags: ["관점 바꾸기", "아이디어 교환", "즉흥 스케치"],
  },
  "auditory-solo-planned": {
    number: "05",
    name: "소리",
    species: "사막여우",
    line: "내 목소리로 차근차근 풀어볼게.",
    intro:
      "조용한 곳에서 오늘 배운 걸 내 문장으로 말해봐. 처음엔 짧아도 괜찮아. 순서대로 설명하다 보면 빈틈이 들려.",
    habit: "혼자 설명할 순서를 정하고 소리 내어 복습해요.",
    action: "책을 덮고 개념 하나를 1분 동안 설명해봐요.",
    tags: ["1분 설명", "차분한 목소리", "복습 루틴"],
  },
  "auditory-solo-flexible": {
    number: "06",
    name: "멜로",
    species: "고양이",
    line: "혼잣말인 줄 알았지? 생각 정리 중!",
    intro:
      "문득 떠오른 질문을 나한테 던져보곤 해. 딱딱한 문장보다 내가 평소 쓰는 말로 풀어낼 때 더 편하거든.",
    habit: "궁금한 질문부터 골라 혼자 말로 풀어봐요.",
    action: "‘왜 그럴까?’ 하나를 골라 내 말로 답해봐요.",
    tags: ["생각의 혼잣말", "질문 수집", "내 말로 정리"],
  },
  "auditory-team-planned": {
    number: "07",
    name: "토크",
    species: "리트리버",
    line: "오늘의 설명 담당, 돌아가면서!",
    intro:
      "혼자 알고 끝내기보다 서로 설명해주는 시간이 좋아. 범위와 차례를 정하고 질문을 하나씩 주고받아보자.",
    habit: "친구와 역할을 나누고 정한 주제를 설명해요.",
    action: "한 명은 설명, 한 명은 질문! 1분 뒤 역할을 바꿔봐요.",
    tags: ["설명 메이트", "질문 릴레이", "함께하는 순서"],
  },
  "auditory-team-flexible": {
    number: "08",
    name: "리프",
    species: "왕관앵무",
    line: "잠깐, 그 얘기 들으니까 궁금한 게 있어!",
    intro:
      "질문 하나가 또 다른 질문으로 이어질 때 신나. 생각나는 예시를 나누고, 마지막엔 오늘의 발견을 한마디로 남겨.",
    habit: "즉석 질문과 대화로 생각의 방향을 넓혀요.",
    action: "친구에게 예상 밖의 ‘왜?’ 질문 하나를 건네봐요.",
    tags: ["대화의 불씨", "즉석 질문", "예시 수집가"],
  },
  "tactile-solo-planned": {
    number: "09",
    name: "토리",
    species: "비버",
    line: "하나씩 꺼내서, 차곡차곡 이해하기.",
    intro:
      "내 손으로 개념을 옮기고 묶어보면 생각이 정돈돼. 기준을 정해 카드를 나누고, 하나씩 확인하는 시간이 좋아.",
    habit: "혼자 기준을 정하고 카드와 조각을 분류해요.",
    action: "핵심어 카드 5장을 만들고 두 가지 기준으로 묶어봐요.",
    tags: ["분류의 취향", "차곡차곡", "손으로 확인"],
  },
  "tactile-solo-flexible": {
    number: "10",
    name: "몽",
    species: "라쿤",
    line: "직접 바꿔보면 뭔가 떠오를걸?",
    intro:
      "종이를 접고 카드를 뒤집고 순서를 바꾸다 보면 새로운 생각이 나. 완벽한 준비보다 일단 만져보는 쪽이 좋아.",
    habit: "혼자 조각을 조합하며 여러 정리 방식을 시도해요.",
    action: "카드 순서를 바꿔보고 왜 그렇게 놓았는지 말해봐요.",
    tags: ["작은 실험", "손끝의 발상", "자유로운 조합"],
  },
  "tactile-team-planned": {
    number: "11",
    name: "블록",
    species: "곰",
    line: "네 조각과 내 조각, 함께 완성하자.",
    intro:
      "할 일을 나누고 각자 만든 조각을 맞추는 게 좋아. 모양이 달라도 연결되는 이유를 설명하면 하나가 될 수 있어.",
    habit: "친구와 역할을 나눠 카드나 모형을 구성해요.",
    action: "개념 카드를 나눠 만들고, 함께 연결 이유를 붙여봐요.",
    tags: ["함께 조립", "역할 나누기", "꾸준한 손길"],
  },
  "tactile-team-flexible": {
    number: "12",
    name: "조이",
    species: "수달",
    line: "그 조각, 여기 붙이면 어때?",
    intro:
      "친구와 조각을 주고받다가 생각지도 못한 모양이 나오는 게 좋아. 정해진 답을 만들기 전에 조합부터 즐겨봐.",
    habit: "만들면서 대화하고 그때그때 조합을 바꿔요.",
    action: "서로 만든 카드 두 장을 골라 새로운 연결을 찾아봐요.",
    tags: ["조합 놀이", "아이디어 핑퐁", "함께 실험"],
  },
  "motion-solo-planned": {
    number: "13",
    name: "페이스",
    species: "펭귄",
    line: "나만의 속도로, 한 구간씩.",
    intro:
      "오래 버티기보다 짧은 구간을 차근차근 이어가고 싶어. 잠깐 자세를 바꾸고 돌아오면 다음 질문부터 시작해.",
    habit: "혼자 공부 구간과 쉬는 타이밍을 정해요.",
    action: "짧게 복습한 뒤 자세를 바꾸고 질문 3개에 답해봐요.",
    tags: ["나만의 페이스", "짧은 루틴", "다시 시작"],
  },
  "motion-solo-flexible": {
    number: "14",
    name: "바니",
    species: "토끼",
    line: "조금 바꿔서, 가볍게 다시 시작!",
    intro:
      "같은 자리에서 막히면 작은 변화를 주고 싶어. 편한 자세를 찾아 다시 시작하고, 궁금한 질문부터 하나 꺼내봐.",
    habit: "컨디션에 맞춰 자세와 공부 순서를 바꿔요.",
    action: "편한 자세로 바꾼 뒤 아까 막힌 질문 하나에 답해봐요.",
    tags: ["가벼운 전환", "자유로운 리듬", "혼자 재충전"],
  },
  "motion-team-planned": {
    number: "15",
    name: "루카",
    species: "허스키",
    line: "우리, 다음 구간도 같이 가볼까?",
    intro:
      "친구들과 공부할 때 시작과 쉼의 리듬을 맞추고 싶어. 각자 답할 시간을 갖고 다시 모여 질문을 확인해보자.",
    habit: "함께 공부 구간을 정하고 짧은 확인 시간을 가져요.",
    action: "각자 질문 3개에 답한 뒤 친구와 답을 비교해봐요.",
    tags: ["리듬 메이트", "함께 체크", "작은 코스"],
  },
  "motion-team-flexible": {
    number: "16",
    name: "스킵",
    species: "쿼카",
    line: "분위기 바꾸고, 한 번 더 해보자!",
    intro:
      "다 같이 막혔을 땐 잠깐 리듬을 바꿔보자. 편하게 자세를 바꾸고 질문을 주고받으면 다시 시작할 계기가 생겨.",
    habit: "서로의 상태에 맞춰 공부 흐름을 유연하게 바꿔요.",
    action: "친구와 자세를 편하게 바꾸고 핵심 질문을 하나씩 내봐요.",
    tags: ["전환의 신호", "함께 재시작", "유연한 리듬"],
  },
};
export const CHARACTER_IMAGES: Record<string, string> = Object.fromEntries(
  Object.keys(CHARACTERS).map((code) => [code, `/characters/${code}.webp`]),
);
export const characterThumbnail = (code: string) =>
  `/characters/thumbs/${code}.png`;
