import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGoods } from "@/lib/goods";
import { canViewSdjPrizes } from "@/lib/sdj-manager";
import { SDJ_EVENT } from "@/lib/sdj-event";

import cardsIcon from "./nav-cards.webp";
import gameIcon from "./nav-game.webp";
import crestCardIcon from "./nav-crest.webp";
import voucherIcon from "./nav-voucher.webp";
import festivalPoster from "./festival-poster.webp";
import meloPreview from "./melo-preview.webp";
import mongPreview from "./mong-preview.webp";
import lumiPreview from "./lumi-preview.webp";
import pangLogo from "./gameplay/pangpangstar-logo.webp";
import mazeLogo from "./gameplay/mazerun-logo.webp";
import pangpangstar from "./gameplay/pangpangstar.webp";
import mazerun from "./gameplay/mazerun.webp";
import { EventEntry } from "./qr-bonus";
import { CrestSample } from "./crest-sample";
import styles from "./page.module.css";
import seoipiCutout from "./seoipi-cutout.webp";
import seoipi from "./seoipi.webp";
import crest from "../../../../ref/서여고 로고.webp";

import melo from "../../../../art/characters/special/events/sdj-character-v2/auditory-solo-flexible--daily-01.webp";
import lumi from "../../../../art/characters/special/events/sdj-character-v2/visual-solo-planned--special-05.webp";
const description =
  "내 공부캐와 나에게 맞는 공부법을 찾고, 다른 학교에 다니는 친구나 동생을 초대해 함께 카드를 모아보세요. 송원제에서는 내가 모은 공부캐로 AI 자체 개발 게임 팡팡스타와 메이즈런을 즐길 수 있어요.";
export const metadata: Metadata = {
  title: SDJ_EVENT.title,
  description,
  alternates: { canonical: SDJ_EVENT.path + "?from=qr" },
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
    card: getGoods("auditory-solo-flexible--daily-01")!,
    image: melo,
    number: 6,
    type: "일상 포토카드",
    name: "멜로",
    title: "코코아는 왜 식을까",
    hint: "코코아 머그잔을 살펴보세요.",
  },
  {
    card: getGoods("visual-solo-planned--special-05")!,
    image: lumi,
    number: 21,
    type: "특별 의상 카드",
    name: "루미",
    title: "새벽 도시의 조감도 화가",
    hint: "화가 앞치마의 작은 자수를 살펴보세요.",
  },
];

export default async function SdjEventPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.from !== "qr") {
    const query = new URLSearchParams({ from: "qr" });
    for (const key of ["manager", "auth", "preview", "bonus"]) {
      const value = params[key];
      if (typeof value === "string") query.set(key, value);
    }
    if (params.start === "1") query.set("bonus", "1");
    redirect(SDJ_EVENT.path + "?" + query.toString());
  }
  const showPrizeResults = await canViewSdjPrizes(true);
  if (showPrizeResults && params.manager === "login" && params.auth === "success") redirect("/admin/sdj-prizes");
  return (
    <main id="main" className={styles.page}>
      <div className={styles.eventBar}>
        <span>StudyCrew × 서대전여자고등학교</span>
        <a href="#participate">매점권 지급 안내 ↓</a>
      </div>
      <section className={styles.festivalCover} aria-labelledby="event-title">
        <h1 id="event-title" className={styles.titleText}>서여고 스페셜 이벤트 · 내 공부캐를 찾으면 랜덤 카드 한 장 더!</h1>
        <Image className={styles.coverArt} src={festivalPoster} preload sizes="(max-width: 1100px) 100vw, 1100px" alt="몽, 루미, 멜로가 펼친 책에서 반짝이는 랜덤 카드를 발견하는 축제 포스터" />
        <div className={styles.coverEntry}>
          <p>카카오톡으로 로그인하고 내 공부캐를 찾아보세요.<br />검사 결과를 도감에 저장하면 <strong>랜덤 공부캐 카드 한 장</strong>을 더 받아요.</p>
          <div id="start">
            <EventEntry
              resume={params.auth === "success" && params.bonus === "1"}
            />
          </div>
        </div>
        <section className={styles.coverSamples} aria-labelledby="sample-cast-title">
          <h2 id="sample-cast-title">공부캐 3인 예시</h2>
          <figure className={styles.cardFan}>
            <Image src={meloPreview} alt="멜로 예시 카드, 청각형 게이지가 가장 높아요." sizes="(max-width: 760px) 30vw, 165px" />
            <Image src={mongPreview} alt="몽 예시 카드, 촉각형 게이지가 가장 높아요." sizes="(max-width: 760px) 30vw, 165px" />
            <Image src={lumiPreview} alt="루미 예시 카드, 시각형 게이지가 가장 높아요." sizes="(max-width: 760px) 30vw, 165px" />
            <figcaption>나는 어떤 공부캐를 만나게 될까?</figcaption>
          </figure>
        </section>
      </section>
      <nav className={styles.sectionNav} aria-label="행사 안내 목차">
        {([
          ["how-to", "공부캐 카드 얻는 법", cardsIcon],
          ["games", "AI 게임", gameIcon],
          ["examples", "교표가 담긴 카드", crestCardIcon],
          ["participate", "카드별 매점권", voucherIcon],
         ] as const).map(([id, title, icon]) => (
          <a key={id} href={`#${id}`}>
            <Image className={styles.navIcon} src={icon} alt="" sizes="42px" />
            <strong>{title}</strong>
            <span className={styles.navArrow} aria-hidden="true">↓</span>
          </a>
        ))}
      </nav>
      <section id="how-to" className={styles.section} aria-labelledby="how-to-title">
        <h2 id="how-to-title">내 공부캐를 찾고, 한 장 더 열어봐!</h2>
        <ol className={styles.steps}>
          <li>
            <span>01</span>
            <h3>나와 닮은 공부캐 찾기</h3>
            <p>
              카카오톡으로 로그인하고 질문에 답해요. 결과에서 내 공부 습관과 나에게
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
            송원제 축제에서 <strong>내 도감에 모은 공부캐</strong>를 골라요.
            <br />
            그 캐릭터로 팡팡스타와 메이즈런을 즐겨 보세요!
          </p>
        </header>
        {[
          {
            name: "팡팡스타",
            shot: pangpangstar,
            logo: pangLogo,
            alt: "눈 덮인 학교 운동장에서 스킵이 멜로에게 폴짝 별똥 박치기를 쓰는 실제 게임 화면",
            caption: "스킵의 ‘폴짝 별똥 박치기’가 멜로에게 적중하는 순간.",
            hook: "지금 쓸까, 필살기까지 모을까?",
            play: "친구와 1대1 대결! 공격을 맞히면 내 별 게이지가 차올라요.",
            moves: [["별 1개", "공부캐 고유 기술 쓰기"], ["별 3개", "모아 둔 별로 필살기 날리기"]],
            win: "두 라운드를 먼저 따내면 승리!",
          },
          {
            name: "메이즈런",
            shot: mazerun,
            logo: mazeLogo,
            alt: "어두운 미로 한가운데 두 플레이어와 등교 완료 표시가 보이는 실제 게임 화면",
            caption: "둘 다 학교 앞에 모였다. 이제 누가 먼저 집에 갈까?",
            hook: "학교 찍고, 누가 먼저 집에 갈까?",
            play: "지나온 길이 점점 어두워져요. 갈림길을 잘 기억해요!",
            moves: [["등교", "안개 속 미로 한가운데 학교 찾기"], ["하교", "학교에서 내 집까지 달리기"]],
            win: "학교에 들른 뒤 내 집에 먼저 도착하면 승리!",
          },
        ].map(({ name, shot, logo, alt, caption, hook, play, moves, win }) => (
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
              <h4 className={styles.gameHook}>{hook}</h4>
              <p>{play}</p>
              <dl className={styles.gameMoves}>
                {moves.map(([label, action]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.gameWin}>{win}</p>
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
        <div className={styles.samples} id="crest-card-preview">
          {cards.map((card) => (
            <CrestSample key={card.title} {...card} initiallyBack={params.preview === "back"} />
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
          <p>2,000원권 총 50장 · 총 상금 10만원</p>
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
        </div>
      </section>
      <div className={styles.eventFooter}>
        <span>StudyCrew × 서여고</span>
        <a href="#start">행사 참여하기 ↑</a>
      </div>
      {showPrizeResults ? (
        <Link className={styles.ledgerLink} href="/admin/sdj-prizes">
          <Image src={voucherIcon} alt="" width={46} height={46} />
          <span>
            <strong>매점권 지급대장</strong>
            <small>당첨 결과 확인 · 지급 처리</small>
          </span>
          <span className={styles.ledgerArrow} aria-hidden="true">→</span>
        </Link>
      ) : params.manager === "login" ? (
        <form className={styles.eventFooter} method="post" action="/api/auth/kakao/start?returnTo=%2Fevents%2Fsdj%3Fmanager%3Dlogin">
          <span>{params.auth ? "운영자 인증을 완료하지 못했어요. 지정된 계정과 이메일 제공 동의를 확인해 주세요." : "행사 운영자 전용"}</span>
          <button className="button secondary" type="submit">카카오톡으로 운영자 로그인</button>
        </form>
      ) : null}
    </main>
  );
}
