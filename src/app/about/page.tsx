import Link from "next/link";
import Image from "next/image";
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
          16문항으로 시각·청각·촉각·운동 선호와 혼자/함께, 계획/즉흥의 조합을
          살펴봐요. 큰 유형은 각 3문항, 나머지 두 축은 각 2문항으로 구성돼요.
          문항별 응답은 1~5점이며, 큰 유형의 합계와 두 보조 축의 점수 차이로
          대표 후보를 골라요.
        </p>
        <p>
          동점이면 직접 대표 활동을 선택해요. 큰 유형의 합계 차이가 1점
          이하이거나 보조 축의 점수 차이가 1점 이하이면 비슷한 선호로 표시해요.
          이 기준은 결과를 단정하지 않기 위한 운영 규칙이며, 검증된 심리검사
          기준은 아니에요.
        </p>
        <p>
          재미로 하는 테스트이며 학습 능력·성적·성격을 진단하지 않아요. 자체
          제작한 문항이며, VARK 공식 검사를 사용하지 않아요. 문항 버전:
          2026-09-v1.
        </p>
      </section>
      <section id="evidence" className="prose-section">
        <h2>왜 이런 공부법을 추천하나요?</h2>
        <p>
          선호하는 방식과 학습 효과는 같지 않을 수 있어요. 그래서 모든 활동에
          ‘보지 않고 떠올리기 → 확인하기 → 다시 시도하기’를 포함했어요. 캐릭터나
          유형이 공부의 가능성을 정하지 않아요.
        </p>
        <ul>
          <li>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11270031/"
              target="_blank"
              rel="noreferrer"
            >
              학습 유형에 맞춘 교육에 관한 2024년 메타분석
            </a>
            : 작은 전체 효과가 있었지만 연구의 질과 제한적인 유형별 효과를
            고려해 광범위한 적용을 뒷받침하기 어렵다고 해석했어요.
          </li>
          <li>
            <a
              href="https://www.aft.org/ae/fall2013/dunlosky"
              target="_blank"
              rel="noreferrer"
            >
              Dunlosky의 학습 전략 설명
            </a>
            : 인출 연습과 간격을 둔 학습은 여러 상황에서 유용성이 높게
            평가됐어요.
          </li>
        </ul>
        <p>
          활동이 편하게 느껴지는 것과 오래 기억하는 것은 다를 수 있어요. 과목과
          상황에 맞춰 직접 시도하고 결과를 살펴보세요.
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
        <p>콘텐츠 기준일: 2026년 9월 30일</p>
      </section>
    </main>
  );
}
