import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SDJ_EVENT } from "@/lib/sdj-event";

import pangLogo from "./gameplay/pangpangstar-logo.webp";
import mazeLogo from "./gameplay/mazerun-logo.webp";
import pangpangstar from "./gameplay/pangpangstar.webp";
import mazerun from "./gameplay/mazerun.webp";
import { QrBonus } from "./qr-bonus";
import { CrestSample } from "./crest-sample";
import styles from "./page.module.css";
import seoipiCutout from "./seoipi-cutout.webp";
import seoipi from "./seoipi.webp";
import crest from "../../../../ref/서여고 로고.webp";

import lumi from "../../../../art/characters/special/events/sdj-character-v2/visual-solo-planned--daily-01.webp";
import melo from "../../../../art/characters/special/events/sdj-character-v2/auditory-solo-flexible--special-01.webp";
const description =
  "내 공부캐와 나에게 맞는 공부법을 찾고, 다른 학교에 다니는 친구나 동생을 초대해 함께 카드를 모아보세요. 송원제에서는 내가 모은 공부캐로 AI 자체 개발 게임 팡팡스타와 메이즈런을 즐길 수 있어요.";
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

const cards = [
  {
    image: lumi,
    type: "일상 포토카드",
    name: "루미",
    title: "산책을 접어 둔 지도",
    hint: "지도 옆 머그잔을 살펴보세요.",
  },
  {
    image: melo,
    type: "특별 의상 카드",
    name: "멜로",
    title: "물음표를 좇는 꿈 탐정",
    hint: "탐정 가방의 장식을 살펴보세요.",
  },
];

export default async function SdjEventPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const fromQr = params.from === "qr";
  return (
    <main id="main" className={styles.page}>
      <div className={styles.eventBar}>
        <span>StudyCrew × 서대전여자고등학교</span>
        <a href="#participate">매점권 지급 안내 ↓</a>
      </div>
      <section className={styles.hero} aria-labelledby="event-title">
        <div>
          <p className={styles.eyebrow}>서여고 포스터 QR 참여 혜택</p>
          <h1 id="event-title">
            내 공부캐를 찾으면
            <br />
            <em>랜덤 카드 한 장 더!</em>
          </h1>
          <p className={styles.lead}>포스터 QR로 참여하면 초대 없이도 한 장을 받아요.</p>
          <p className={styles.intro}>
            포스터 QR로 카카오 로그인 후 검사 결과를 도감에 저장하세요. 나와
            닮은 공부캐를 만나고, 선물로 받은 카드 한 장을 열어 다른 공부캐도
            만날 수 있어요.
          </p>{" "}
          <div id="start">
            {fromQr ? (
              <QrBonus
                resume={params.bonus === "1" && params.auth === "success"}
              />
            ) : (
              <Link className={styles.primary} href="/quiz">
                내 공부캐 찾기 ↗
              </Link>
            )}
          </div>
        </div>
        <div
          className={styles.rewardPair}
          aria-label="내 검사 결과 카드와 랜덤 공부캐 카드"
        >
          <figure>
            <Image
              src="/result-cards/visual-solo-planned-fixed-v2.webp"
              alt="검사 결과 카드 예시, 루미"
              width={240}
              height={360}
            />
            <figcaption>내 검사 결과 카드</figcaption>
          </figure>
          <span aria-hidden="true">+</span>
          <figure>
            <Image
              src="/ui-icons/card-pack-v1.webp"
              alt="도감에서 열어 보는 미개봉 카드팩"
              width={240}
              height={240}
            />
            <figcaption>랜덤 공부캐 카드</figcaption>
          </figure>
        </div>
      </section>
      <nav className={styles.sectionNav} aria-label="이벤트 상세 안내">
        <a href="#how-to">공부캐 카드 얻는 법</a>
        <a href="#games">AI 게임</a>
        <a href="#examples">교표가 담긴 카드</a>
        <a href="#participate">카드별 매점권</a>
      </nav>
      <section className={styles.section} aria-labelledby="how-to">
        <h2 id="how-to">내 공부캐를 찾고, 한 장 더 열어봐!</h2>
        <ol className={styles.steps}>
          <li>
            <span>01</span>
            <h3>나와 닮은 공부캐 찾기</h3>
            <p>
              카톡으로 로그인하고 질문에 답해요. 결과에서 내 공부 습관과 나에게
              맞는 공부법을 확인하고 도감에 저장해요.
            </p>
          </li>
          <li>
            <span>02</span>
            <h3>도감에서 랜덤 공부캐 카드 열기</h3>
            <p>
              내 도감에서 랜덤 카드 한 장을 열어 아직 만나지 못한 공부캐를
              확인해요. 이 카드는 계정당 한 번 받을 수 있으며, 이미 16명을 모두
              모았다면 추가로 열 캐릭터가 없어요.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>다른 학교 친구나 동생 초대하기</h3>
            <p>
              다른 학교에 다니는 친구나 동생에게 내 초대 링크를 보내세요. 초대받은 사람이 처음으로 검사 결과를 저장하면 두 사람 모두 랜덤 공부캐 카드를 한 장씩
              받아요. 모은 공부캐 중 하나를 골라 송원제에서 플레이하세요.
            </p>
          </li>
        </ol>
      </section>
      <section
        id="games"
        className={styles.arcade}
        aria-labelledby="games-title"
      >
        <header>
          <p className={styles.eyebrow}>직접 개발한 AI 게임 2종</p>
          <h2 id="games-title">내가 모은 공부캐로 한 판 붙을래?</h2>
          <p>
            송원제에 오면 내 도감에서 캐릭터를 골라 직접 플레이할 수 있어요.
          </p>
        </header>
        {[
          {
            name: "팡팡스타",
            shot: pangpangstar,
            logo: pangLogo,
            alt: "눈 덮인 학교 운동장에서 스킵이 멜로에게 폴짝 별똥 박치기를 쓰는 실제 게임 화면",
            caption: "스킵의 ‘폴짝 별똥 박치기’가 멜로에게 적중하는 순간.",
            rule: "상대를 맞혀 별을 모으면 내 공부캐만의 스킬을 쓸 수 있어요.",
          },
          {
            name: "메이즈런",
            shot: mazerun,
            logo: mazeLogo,
            alt: "어두운 미로 한가운데 두 플레이어와 등교 완료 표시가 보이는 실제 게임 화면",
            caption: "둘 다 학교 앞에 모였다. 이제 누가 먼저 집에 갈까?",
            rule: "친구와 안개 낀 미로를 달려요. 학교에 들렀다가 자기 집에 먼저 도착하면 승리!",
          },
        ].map(({ name, shot, logo, alt, caption, rule }) => (
          <article key={name} className={styles.gameFeature}>
            <div className={styles.gameText}>
              <h3>
                <Image
                  className={styles.gameLogo}
                  src={logo}
                  alt={name}
                  sizes="(max-width:760px) 230px, 310px"
                />
              </h3>
              <p>{rule}</p>
            </div>
            <figure>
              <a
                href={shot.src}
                aria-label={name + " 실제 게임 화면 크게 보기"}
              >
                <Image
                  src={shot}
                  sizes="(max-width: 760px) 94vw, 720px"
                  alt={alt}
                />
              </a>
              <figcaption>{caption}</figcaption>
            </figure>
          </article>
        ))}
      </section>
      <section
        id="examples"
        className={styles.section}
        aria-labelledby="examples-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>서여고 교표가 담긴 카드</p>
            <h2 id="examples-title">교표, 어디에 숨었을까?</h2>
          </div>
          <figure className={styles.crestNote}>
            <Image
              className={styles.schoolCrest}
              src={crest}
              alt="서여고 교표"
              width={56}
              height={53}
            />
            <figcaption>
              서대전여고 교표의 세잎 크로바는 교육의 3주체(학생, 교사, 학부모)를
              상징합니다.
            </figcaption>
          </figure>
        </div>
        <aside className={styles.mascotGuide} aria-label="서잎이의 교표 찾기 안내">
          <figure>
            <Image src={seoipi} alt="빨강·파랑 리본을 맨 세잎 모양 마스코트" sizes="(max-width: 620px) 78px, 126px" />
            <figcaption>서여고 마스코트 <strong>서잎이</strong></figcaption>
          </figure>
          <div className={styles.crestGuide}>
          <p>교표가 들어갈 개인 카드 도안은 무작위로 정해져요. <strong>QR 참여자 중 그 도안을 가장 먼저 얻은 한 명</strong>이 교표 카드를 받아요.</p>
          <p><strong>교표가 없는 카드는 꽝!</strong><br />매점권은 교표가 있는 카드에만 지급해요.</p>
        </div>
        </aside>
        <div className={styles.cardKinds}>
          <p>개인 굿즈에서는 <strong>일상 포토카드</strong>와 <strong>특별 의상 카드</strong>에 서여고 교표가 숨어 있을 수 있어요.</p>
          <p>스페셜 모션 카드는 영상으로 즐기는 카드예요.</p>
        </div>
        <p className={styles.sampleTip}>아래 카드 그림을 눌러 크게 보고, 숨은 교표를 찾아보세요.</p>
        <div className={styles.samples}>
          {cards.map((card) => (
            <CrestSample key={card.title} {...card} />
          ))}
        </div>
      </section>
      <section
        id="participate"
        className={styles.detailsSection}
        aria-labelledby="details-title"
      >
        <div>
          <p className={styles.eyebrow}>서여고 학생·선생님 대상</p>
          <div className={styles.prizeHeading}>
          <h2 id="details-title">
            교표를 찾으면
            <br />
            카드에 따라 매점권을 받아요
          </h2>
          <Image src={seoipiCutout} alt="" sizes="90px" />
          </div>
          <p>2,000원권 총 50장 · 총 10만 원</p>
        </div>
        <div className={styles.detailBody}>
          <dl className={styles.facts}>
            <div>
              <dt>지급 장소</dt>
              <dd>서대전여고 1층 전산실</dd>
            </div>
            <div>
              <dt>일상 포토카드</dt>
              <dd>2,000원 × 15건</dd>
            </div>
            <div>
              <dt>특별 의상 카드</dt>
              <dd>4,000원 × 9건</dd>
            </div>
            <div>
              <dt>유형별 단체 카드(4인)</dt>
              <dd>6,000원 × 4건 (유형별 1건)</dd>
            </div>
            <div>
              <dt>전체 단체 카드(16인)</dt>
              <dd>10,000원 × 1건</dd>
            </div>
          </dl>
          <p><strong>일찍 모을수록 유리해요.</strong><br />당첨 번호는 총 29개예요. 카드를 먼저 얻은 순서로 번호가 배정되므로, 일찍 시작하면 아직 남아 있는 번호가 더 많을 수 있어요.</p>
          <p className={styles.noPrizeNote}><strong>교표가 없는 카드는 꽝이에요.<br />매점권은 지급되지 않아요.</strong></p>
          <p>매점권 한 장은 <strong>2,000원</strong>이에요.
            <br />
            여러 카드에서 교표를 찾으면 각 카드의 금액을 더해요.
          </p>
          <div className={styles.payoutExample}>
            <h3>두 카드에서 교표를 찾았다면?</h3>
            <dl>
              <div>
                <dt>전체 단체 카드(16인)</dt>
                <dd>10,000원</dd>
              </div>
              <div>
                <dt>특별 의상 카드</dt>
                <dd>+ 4,000원</dd>
              </div>
            </dl>
            <p>
              <strong>총 14,000원</strong> · 매점권 7장
            </p>
          </div>
          <p>행사 일정은 추후 이 페이지에서 안내할게요.</p>
        </div>
      </section>
      <div className={styles.eventFooter}>
        <span>StudyCrew × 서여고</span>
        <a href="#start">내 공부캐 찾으러 가기 ↑</a>
      </div>
    </main>
  );
}
