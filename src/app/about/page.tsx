import Link from "next/link";
import Image from "next/image";
import { QUESTIONS, SITUATIONS, PAIRS, VERSION } from "@/lib/content";
export const metadata = { title: "테스트와 학교 활용 안내" };
export default function Page() {
  return (
    <main id="main" className="prose-shell">
      <span className="eyebrow">공부캐를 소개해요</span>
      <h1>
        캐릭터는 재미로,
        <br />
        공부법은 다양하게.
      </h1>
      <p className="prose-lead">
        공부캐는 재미로 즐기는 공부 캐릭터 테스트예요. 다양한 공부 스타일과
        공부법이 있다는 것을 알아보고, 새로운 방법을 가볍게 시도하도록
        만들었어요. 캐릭터 하나로 나를 정의하거나 공부 방법을 정할 필요는
        없어요.
      </p>
      <section className="prose-section">
        <h2>어떤 테스트인가요?</h2>
        <p>
          {QUESTIONS.length}문항으로 시각·청각·촉각·운동 선호와 혼자/함께,
          계획/즉흥의 조합을 살펴봐요. 큰 유형은 {SITUATIONS.length}가지 공부
          상황마다 네 가지 방법 중 가장 먼저 손이 가는 하나를 골라, 가장 많이
          고른 방식을 대표로 삼아요. 두 보조 축은 축마다 {PAIRS.length / 2}
          문항으로, 두 문장 중 요즘의 나에게 더 가까운 쪽을 4단계로 골라요.
        </p>
        <p>
          같은 상황 안에서 방법을 견주게 하면, 무엇이든 ‘그렇다’고 답하거나
          ‘보통’을 고르는 습관이 결과에 덜 섞여요. 가장 많이 고른 방식이 둘
          이상이면 직접 대표 활동을 골라요. 1위와 2위의 차이가 1번 이하이거나
          보조 축의 합계가 ±3 이내이면 비슷한 선호로 표시해요. 이 기준은 결과를
          단정하지 않기 위한 운영 규칙이며, 검증된 심리검사 기준은 아니에요.
        </p>
        <p>
          재미로 하는 테스트이며 학습 능력·성적·성격을 진단하지 않아요. 자체
          제작한 문항이며, VARK 공식 검사를 사용하지 않아요. 문항 버전:{" "}
          {VERSION}.
        </p>
      </section>
      <section id="evidence" className="prose-section">
        <h2>왜 이런 공부법을 추천하나요?</h2>
        <p>
          공부법에 따라 기억에 남는 정도는 크게 달라져요. 하지만 그 차이를
          만드는 것은 ‘시각형이라서 그림’ 같은 감각 유형이 아니라, 어떤 공부
          전략을 쓰느냐에 가까워요. 그래서 공부캐의 모든 활동은 효과가 꾸준히
          확인된 전략을 바탕에 두고, 그 전략을 내가 끌리는 방식(그리기·말하기·
          손으로 다루기·몸 움직이기)으로 실행하게 짰어요.
        </p>
        <ul>
          <li>
            <strong>인출 연습과 분산 학습</strong>: 책을 덮고 떠올린 뒤
            확인하고, 며칠 간격을 두고 다시 떠올리는 방법이에요. 여러 학습 전략
            중 유용성이 가장 높게 평가됐어요.{" "}
            <a
              href="https://www.aft.org/ae/fall2013/dunlosky"
              target="_blank"
              rel="noreferrer"
            >
              Dunlosky의 학습 전략 정리
            </a>
          </li>
          <li>
            <strong>교차 연습·자기 설명·정교화 질문</strong>: 다른 유형의 문제를
            섞어 풀기, 풀이의 이유를 스스로 설명하기, ‘왜?’를 묻고 답하기예요.
            같은 정리에서 중간 정도의 유용성으로 평가됐어요.
          </li>
          <li>
            <strong>기억으로 개념 지도 그리기</strong>: 책을 보며 그리는 것보다
            책을 덮고 떠올려 그릴 때 1주 뒤 기억이 더 좋았어요.{" "}
            <a
              href="https://learningscientists.org/blog/2020/11/19-1"
              target="_blank"
              rel="noreferrer"
            >
              인출 기반 개념 지도 소개
            </a>
          </li>
          <li>
            <strong>소리 내기 효과</strong>: 핵심을 소리 내어 말한 내용은
            눈으로만 읽은 내용보다 잘 기억되는 경향이 있어요. 모든 것을 소리
            내기보다 핵심만 골라 소리 낼 때 차이가 두드러져요.{" "}
            <a
              href="https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/files/jeplmc10-2.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Ozubko & MacLeod(2010)
            </a>
          </li>
          <li>
            <strong>동작 효과와 장소 기억법</strong>: 직접 동작으로 해 본 내용은
            읽기만 한 내용보다 잘 기억되고, 익숙한 장소에 내용을 놓아 떠올리는
            방법도 도움이 됐어요. 다만 장소 기억법의 효과는 연구에 따라 작게
            나오기도 해요.{" "}
            <a
              href="https://doi.org/10.1037/bul0000360"
              target="_blank"
              rel="noreferrer"
            >
              동작 효과 메타분석(2022)
            </a>
            ,{" "}
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/"
              target="_blank"
              rel="noreferrer"
            >
              장소 기억법 메타분석(2025)
            </a>
          </li>
          <li>
            <strong>함께 공부할 때는 각자 먼저</strong>: 처음부터 함께 떠올리면
            서로의 기억 순서를 따라가느라 덜 떠오르는 경향이 있어요. 각자 먼저
            떠올린 뒤 비교하면 함께하는 장점을 살릴 수 있어요.{" "}
            <a
              href="https://livrepository.liverpool.ac.uk/3002331/"
              target="_blank"
              rel="noreferrer"
            >
              협력 회상 메타분석(2016)
            </a>
          </li>
          <li>
            <strong>언제·어디서·무엇을 정해 두기</strong>: 실행할 때와 장소를
            구체적으로 정해 두면 목표를 실천할 가능성이 높아졌어요.{" "}
            <a
              href="https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes"
              target="_blank"
              rel="noreferrer"
            >
              실행 의도 메타분석(2006)
            </a>
          </li>
        </ul>
        <p>
          모든 활동에는 ‘내 수준에 맞추기’ 규칙이 있어요. 다 맞히면 범위를
          넓히고, 절반 넘게 막히면 범위를 줄여요. 너무 쉬우면 남는 게 적고, 너무
          어려우면 떠올릴 거리가 없기 때문이에요.
        </p>
        <p>
          한편 선호하는 감각에 맞춰 가르치면 더 잘 배운다는 근거는 약해요.{" "}
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11270031/"
            target="_blank"
            rel="noreferrer"
          >
            2024년 메타분석
          </a>
          은 작은 전체 효과를 보고했지만, 연구의 질과 제한적인 유형별 효과를
          고려해 널리 적용하기 어렵다고 해석했어요. 활동이 편하게 느껴지는 것과
          오래 기억하는 것은 다를 수 있으니, 다른 공부캐의 방법도 직접 시도해
          보세요.
        </p>
      </section>
      <section className="prose-section">
        <h2>학교에서는 이렇게 활용하세요.</h2>
        <ol>
          <li>
            재미로 다양한 공부 스타일과 공부법을 알아보는 활동임을 먼저
            안내하고, 참여를 자율적으로 선택하게 해주세요.
          </li>
          <li>QR이나 링크로 접속해 약 3~5분 동안 검사해요.</li>
          <li>공부법 하나를 선택해 10분 동안 직접 시도해요.</li>
          <li>
            “어떤 유형인가요?” 다음으로 “무엇을 시도했고 어떻게 달랐나요?”를
            이야기해요.
          </li>
        </ol>
        <p>
          유형별 반 편성, 성적 예측, 학생 간 순위 비교에는 사용하지 마세요.
          교사는 학생의 개별 응답이나 개인 결과를 조회할 수 없어요.
        </p>
        <Link href="/types" className="text-link">
          학생에게 보이는 결과 예시 살펴보기 →
        </Link>
      </section>
      <section className="prose-section qr-section">
        <Image
          unoptimized
          src="/api/qr"
          width="144"
          height="144"
          alt="공부캐 시작 화면으로 이동하는 QR 코드"
        />
        <div>
          <h2>포스터에 붙여보세요.</h2>
          <p>
            운영 주소로 연결되는 QR이에요. 배포 시 사이트 주소를 설정한 뒤
            내려받아 사용하세요.
          </p>
          <a className="text-link" href="/api/qr" download="공부캐-QR.png">
            QR 이미지 내려받기 →
          </a>
        </div>
      </section>
      <section className="prose-section">
        <h2>저장과 운영 안내</h2>
        <p>
          답변은 기기에만 저장해요. 서비스 개선을 위해 검사 1회에 대한 임시 ID와
          시작·완료·활동 시도 등의 최소 이용 통계를 처리해요. 자세한 항목과 보관
          기간은 <Link href="/privacy">저장 및 개인정보 안내</Link>에서
          확인하세요.
        </p>
        {process.env.NEXT_PUBLIC_CONTACT_EMAIL && (
          <p>
            문의:{" "}
            <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
              {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>
          </p>
        )}
        <p>콘텐츠 기준일: 2026년 10월 1일</p>
      </section>
    </main>
  );
}
