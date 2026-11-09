import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SDJ_EVENT } from "@/lib/sdj-event";
import { EventEnrollment } from "./event-enrollment";
import styles from "./page.module.css";
import crest from "../../../../ref/서여고 로고.webp";

const description =
  "내 공부캐와 나에게 맞는 공부법을 찾고, 다른 학교 친구를 초대해 함께 카드를 모아보세요. 서여고 가족에게는 한정 배지 카드와 매점권 당첨 기회까지!";
export const metadata: Metadata = {
  title: SDJ_EVENT.title,
  description,
  alternates: { canonical: SDJ_EVENT.path },
  twitter: {
    card: "summary",
    title: SDJ_EVENT.title,
    description,
    images: [crest.src],
  },
  openGraph: {
    title: SDJ_EVENT.title,
    description,
    images: [
      {
        url: crest.src,
        width: crest.width,
        height: crest.height,
        alt: "서대전여자고등학교 교표",
      },
    ],
  },
};

export default function SdjEventPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.eventBar}>
        <span>
          StudyCrew <span aria-hidden="true">×</span> 서대전여자고등학교
        </span>
        <a href="#participate">
          참가 신청 중 <span aria-hidden="true">↗</span>
        </a>
      </div>
      <section className={styles.hero} aria-labelledby="event-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>서여고 가족에게 보내는 특별한 초대</p>
          <h1 id="event-title">
            우리 학교만의,
            <br />
            조금 <em>특별한</em> 카드.
          </h1>
          <p className={styles.lead}>
            내 공부캐와 공부법을 찾고,
            <br />
            친구랑 함께 카드를 모아봐요.
          </p>
          <p className={styles.intro}>
            다른 학교 친구에게도 “너는 무슨 공부캐?”
            <br />
            서여고 가족은 운이 좋으면{" "}
            <strong className={styles.prizeHighlight}>매점권 당첨</strong>까지!
          </p>
          <a className={styles.primary} href="#participate">
            참가 신청하고 공부캐 찾기 <span aria-hidden="true">↗</span>
          </a>
          <a className={styles.textLink} href="#invitation">
            어떻게 즐기는지 알아보기 <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div
          className={styles.cardStage}
          role="img"
          aria-label="앞면을 공개하지 않은 서여고 한정 카드"
        >
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.sealedCard} aria-hidden="true">
            <span>서여고 한정 카드</span>
            <b>✳</b>
            <span>캐릭터는 아직 비공개</span>
          </div>
          <div className={styles.sealedCard} aria-hidden="true">
            <span>서여고 한정 카드</span>
            <b>✳</b>
            <span>캐릭터는 아직 비공개</span>
          </div>
          <div className={styles.sealedCard} aria-hidden="true">
            <span className={styles.sealedEdition}>
              SEODAEJEON
              <br />
              SPECIAL EDITION
            </span>
            <div className={styles.sealedCrest}>
              <Image src={crest} alt="" width={66} height={62} priority />
            </div>
            <strong>
              서여고 한정
              <br />
              배지 카드
            </strong>
            <span className={styles.sealedFoot}>캐릭터는 아직 비공개</span>
          </div>
        </div>
      </section>
      <div className={styles.invitation}>
        <span className={styles.invitationLabel}>친구와 함께</span>
        <p>
          <strong>
            공부캐 찾기와 카드 수집은 다른 학교 친구도 함께 즐길 수 있어요.
          </strong>
        </p>
        <span className={styles.invitationMark} aria-hidden="true">
          ✳
        </span>
      </div>

      <section
        id="invitation"
        className={styles.teaser}
        aria-labelledby="teaser-title"
      >
        <div>
          <p className={styles.eyebrow}>
            내 공부 스타일, 친구와 얼마나 다를까?
          </p>
          <h2 id="teaser-title">
            내 공부캐는 찾고,
            <br />
            <span>친구 공부캐는 궁금하고.</span>
          </h2>
        </div>
        <div className={styles.teaserCopy}>
          <p>
            StudyCrew에서 질문에 답하면 나를 닮은 공부 캐릭터,
            <strong>‘공부캐’</strong>를 만날 수 있어요. 내 공부 성향을 알아보고,
            나에게 맞는 공부법도 찾아보세요.
          </p>
          <p>
            친구의 공부캐도 궁금하다면 초대 링크를 보내보세요.
            <strong>다른 학교 친구도 환영!</strong> 서로 어떤 공부캐인지
            이야기하고, 새로운 카드를 함께 모아 도감을 채워봐요.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>공부캐 발견부터 친구 초대까지</p>
            <h2 id="how-title">이렇게 함께 즐겨요.</h2>
          </div>
        </div>
        <ol className={styles.steps}>
          <li>
            <span>01</span>
            <h3>나를 닮은 공부캐 찾기</h3>
            <p>
              검사로 내 공부캐를 만나고, 나에게 맞는 공부법을 알아봐요. 첫
              공부캐를 내 도감에 저장하면 카드 모으기가 시작돼요.
            </p>
          </li>
          <li>
            <span>02</span>
            <h3>다른 학교 친구도 초대하기</h3>
            <p>
              내 도감의 초대 링크를 친구에게 보내요. 새 친구가 링크로 들어와 첫
              검사 결과를 계정에 저장하면 나도, 친구도 새 공부캐 카드를 받아요.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>
              서여고라면,{" "}
              <strong className={styles.prizeHighlight}>매점권</strong> 행운도!
            </h3>
            <p>
              이 페이지에서 신청한 서여고 학생·선생님에게는 한정{" "}
              <strong className={styles.badgeHighlight}>배지 카드</strong>와{" "}
              <strong className={styles.prizeHighlight}>매점권</strong> 당첨
              기회도 준비하고 있어요. 지급 일정과 당첨 조건은 행사 시작 전에
              안내할게요.
            </p>
          </li>
        </ol>
      </section>

      <section
        id="participate"
        className={styles.registration}
        aria-labelledby="join-title"
      >
        <div className={styles.registrationIntro}>
          <Image
            src={crest}
            alt="서대전여자고등학교 교표"
            width={64}
            height={60}
          />
          <p className={styles.eyebrow}>서여고 가족을 위한 추가 이벤트</p>
          <h2 id="join-title">
            우리 학교{" "}
            <strong className={styles.badgeHighlight}>배지 카드</strong>에
            <br />
            <strong className={styles.prizeHighlight}>매점권</strong>의
            행운까지.
          </h2>
          <p>
            학교 교표가 들어간 한정 디지털 카드, 친구에게 자랑해 보세요.
            <br />
            서여고 학생과 선생님은 카카오로 이벤트를 신청해 주세요. 처음
            이용하는 분도, 기존 회원도 참여할 수 있어요.
          </p>
        </div>
        <EventEnrollment />
      </section>

      <section
        className={styles.detailsSection}
        aria-labelledby="details-title"
      >
        <div>
          <p className={styles.eyebrow}>
            서여고 <span className={styles.badgeHighlight}>배지 카드</span> ·{" "}
            <span className={styles.prizeHighlight}>매점권</span> 안내
          </p>
          <h2 id="details-title">행사 안내</h2>
          <p>
            확정된 내용은
            <br />이 페이지에 안내할게요.
          </p>
        </div>
        <div className={styles.detailBody}>
          <dl className={styles.facts}>
            <div>
              <dt>학교 이벤트 대상</dt>
              <dd>서대전여고 학생 및 선생님</dd>
            </div>
            <div>
              <dt>현재 단계</dt>
              <dd>사전 신청 중 · 배지 카드 지급과 경품 추첨은 추후 시작</dd>
            </div>
            <div>
              <dt>배지 카드 일정</dt>
              <dd>{SDJ_EVENT.schedule}</dd>
            </div>
            <div>
              <dt>카드별 수량</dt>
              <dd>{SDJ_EVENT.quantity}</dd>
            </div>
            <div>
              <dt>이벤트 상품</dt>
              <dd>{SDJ_EVENT.prizes}</dd>
            </div>
          </dl>
          <div className={styles.faq}>
            <details>
              <summary>공부캐 찾기와 친구 초대는 지금 할 수 있나요?</summary>
              <p>
                네. 공부캐 검사와 공부법 탐색, 일반 카드 수집과 친구 초대는 지금
                이용할 수 있어요. 서여고 한정 배지 카드와 매점권 이벤트는 현재
                사전 신청 단계예요. 신청만으로 당첨되지는 않아요.
              </p>
            </details>
            <details>
              <summary>다른 학교 친구에게는 어떤 링크를 보내나요?</summary>
              <p>
                내 도감에서 만든 개인 초대 링크를 보내 주세요. 친구는 공부캐와
                공부법을 찾고 일반 카드를 함께 모을 수 있어요. 학교 포스터 QR은
                서여고 학생·선생님의 이벤트 신청용이에요. 한정 배지 카드와
                매점권 이벤트는 서여고 가족을 대상으로 해요.
              </p>
            </details>
            <details>
              <summary>다시 올 때도 포스터 QR을 찍어야 하나요?</summary>
              <p>
                아니요. 한 번 신청하면 같은 카카오 계정에 신청 내역이 남아요.
                다음부터는 QR을 다시 찍지 않고 접속해도 돼요.
              </p>
            </details>
          </div>
        </div>
      </section>
      <div className={styles.eventFooter}>
        <span>StudyCrew · {SDJ_EVENT.title}</span>
        <Link href="/">StudyCrew 서비스 둘러보기 ↗</Link>
      </div>
    </main>
  );
}
