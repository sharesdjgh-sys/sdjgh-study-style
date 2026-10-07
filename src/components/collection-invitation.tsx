"use client";

import Image from "next/image";
import Link from "next/link";
import { CHARACTERS } from "@/lib/characters";
import { getType } from "@/lib/content";
import { collectionProgress } from "@/lib/collection-progress";
import { useCollection } from "./collection-provider";
import { Heart } from "./skill-ui";
import { Star } from "./star-wallet";
import { SignatureBadge } from "./skill-badges";
import { GroupPhotoSilhouette } from "./group-photo-silhouette";
import styles from "./collection-invitation.module.css";

export function CollectionInvitation() {
  const { data, loaded, error } = useCollection();
  const ready = loaded && !error;
  const first =
    ready && data.signedIn ? getType(data.firstType ?? "") : undefined;
  const progress = collectionProgress(data);
  const complete = ready && progress.unlocked;
  const giftsReady = ready && progress.pending > 0;
  const invitesDone = giftsReady && progress.remainingInvites === 0;
  const canInvite = ready && first && !!data.inviteCode;
  return (
    <header className={styles.hero} id="invite-friends">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>공부캐 도감 · 친구와 함께 모아요</span>
        <div
          className={`${styles.headingRow} ${first ? styles.withBadge : ""}`}
        >
          <h1>
            {complete ? (
              <>
                열여섯 친구를 다 모았어.
                <br />
                <em>너의 공부캐도 궁금해!</em>
              </>
            ) : invitesDone ? (
              <>
                친구들이 보내준 선물,
                <br />
                <em>이제 열어볼까요?</em>
              </>
            ) : first ? (
              <>
                내 공부캐는 {CHARACTERS[first.code].name}.<br />
                <em>너는 어떤 친구야?</em>
              </>
            ) : (
              <>
                너는 어떤 공부캐야?
                <br />
                <em>친구랑 같이 만나봐요.</em>
              </>
            )}
          </h1>
          {first && (
            <div className={styles.myBadge}>
              <SignatureBadge
                code={first.code}
                imageSizes="(max-width: 767px) 96px, 160px"
              />
            </div>
          )}
        </div>
        <p className={styles.rewardCopy}>
          {complete ? (
            <>
              친구에게 나의 도감을 자랑하고,
              <br />
              친구의 첫 공부캐도 만나보세요.
            </>
          ) : invitesDone ? (
            <>
              필요한 초대는 모두 끝났어요.
              <br />
              <strong>도착한 선물 {progress.pending}개</strong>를 열면 도감
              완성!
            </>
          ) : (
            <>
              초대한 친구가 첫 도감 저장을 마치면,
              <br />
              <strong>나도 1명, 친구도 1명.</strong> 새 공부캐를 받아요.
            </>
          )}
        </p>
        {(invitesDone || !canInvite) && (
          <div className={styles.cta}>
            {invitesDone ? (
              <a className="button primary" href="#reward-inbox">
                도착한 선물 열러 가기 →
              </a>
            ) : (
              <a className="button primary" href="#collection-notebook">
                {!ready
                  ? "내 도감 확인하기"
                  : data.signedIn
                    ? "첫 공부캐 저장하고 초대하기"
                    : "로그인하고 내 초대 링크 만들기"}{" "}
                →
              </a>
            )}
          </div>
        )}
        {!complete && !invitesDone && (
          <ol className={styles.steps} aria-label="초대 보상을 받는 순서">
            <li>
              <span aria-hidden="true">1</span>
              <strong>친구의 첫 검사</strong>
            </li>
            <li>
              <span aria-hidden="true">2</span>
              <strong>카카오 로그인</strong>
            </li>
            <li>
              <span aria-hidden="true">3</span>
              <strong>도감 저장</strong>
            </li>
          </ol>
        )}
        {giftsReady && !invitesDone && (
          <a className={styles.pending} href="#reward-inbox">
            먼저 열어볼 선물이 {progress.pending}개 도착했어요 <span>→</span>
          </a>
        )}
      </div>
      <div
        className={styles.present}
        aria-label={
          complete
            ? "도감 완성 기념"
            : "초대 성공 시 나와 친구에게 도착하는 공부캐 선물"
        }
      >
        <span className={styles.presentLabel}>
          {complete
            ? "열여섯 친구, 모두 만났어요"
            : invitesDone
              ? "어떤 친구들이 기다릴까요?"
              : "함께 받는 초대 선물"}
        </span>
        <div className={styles.packs}>
          <figure>
            <div className={styles.pack}>
              <Image
                src={
                  complete
                    ? "/ui-icons/nav-collection.webp"
                    : "/ui-icons/card-pack-v1.webp"
                }
                alt={
                  complete
                    ? "완성한 공부캐 도감"
                    : "나에게 도착하는 미개봉 공부캐 카드팩"
                }
                width={240}
                height={360}
                sizes="(max-width: 767px) 120px, 180px"
                priority
              />
            </div>
            <figcaption>
              {complete
                ? "나의 완성 도감"
                : invitesDone
                  ? "도착한 선물"
                  : "나에게"}{" "}
              <strong>
                {complete
                  ? "16명"
                  : invitesDone
                    ? `${progress.pending}개`
                    : "새 공부캐 1명"}
              </strong>
            </figcaption>
          </figure>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
          <figure>
            <div className={styles.pack}>
              <Image
                src={
                  invitesDone
                    ? "/ui-icons/nav-collection.webp"
                    : "/ui-icons/card-pack-v1.webp"
                }
                alt={
                  invitesDone
                    ? "완성을 기다리는 도감"
                    : "친구에게 도착하는 미개봉 공부캐 카드팩"
                }
                width={240}
                height={360}
                sizes="(max-width: 767px) 120px, 180px"
                priority
              />
            </div>
            <figcaption>
              {invitesDone ? "모두 열면" : "친구에게"}{" "}
              <strong>{invitesDone ? "도감 완성!" : "새 공부캐 1명"}</strong>
            </figcaption>
          </figure>
        </div>
        {!complete && (
          <div className={styles.packRewards}>
            <strong>카드를 열면 시그니처 스킬도 함께!</strong>
            <ul aria-label="카드 개봉 추가 보상">
              <li>
                <Heart size={22} />
                <span>
                  하트 <b>1~3개</b>
                </span>
              </li>
              <li>
                <Star size={22} />
                <span>
                  별 <b>1~2개</b>
                </span>
              </li>
            </ul>
            <small>카드마다 랜덤 지급 · 별로 굿즈를 모아요</small>
          </div>
        )}
        <p>
          {complete
            ? "친구의 도감은 어떤 모습일까요?"
            : "아직 만나지 못한 친구가 들어 있어요."}
        </p>
      </div>
      <div className={styles.milestones} aria-label="도감 수집 기념사진 보상">
        <Link
          className={styles.milestone}
          href={`/types?style=${first?.modality ?? "visual"}#family-collection-photo`}
        >
          <div className={styles.photoPreview} aria-hidden="true">
            <GroupPhotoSilhouette modality={first?.modality ?? "visual"} />
            <span>유형별 기념사진</span>
          </div>
          <div className={styles.milestoneCopy}>
            <span className={styles.milestoneLabel}>
              모으는 재미는 계속돼요
            </span>
            <h2>
              같은 유형 <b>4명</b>을 모으면
            </h2>
            <p>우리끼리, 유형별 기념사진</p>
            <span className={styles.milestoneLink}>
              기념사진 보러 가기 <span aria-hidden="true">↗</span>
            </span>
          </div>
        </Link>
        <Link
          className={`${styles.milestone} ${styles.specialMilestone}`}
          href="/types#collection-completion"
        >
          <div className={styles.photoPreview} aria-hidden="true">
            <GroupPhotoSilhouette />
            <span>스페셜 단체사진</span>
          </div>
          <div className={styles.milestoneCopy}>
            <span className={styles.milestoneLabel}>도감을 완성한 순간</span>
            <h2>
              <b>16명</b> 모두 모으면?
            </h2>
            <p>스페셜 단체사진이 열려요</p>
            <span className={styles.milestoneLink}>
              완성 선물 보러 가기 <span aria-hidden="true">↗</span>
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
