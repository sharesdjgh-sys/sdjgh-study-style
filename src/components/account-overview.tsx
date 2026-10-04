"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import { getType } from "@/lib/content";
import { clearSession } from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { useCollection } from "./collection-provider";
import { useSavedSession } from "./use-saved-session";
import { useAccountResults } from "./account-results-provider";
import { SavedResults } from "./saved-results";
import { ClearRecords } from "./clear-records";
import { useConfirm } from "./ui/confirm-dialog";
import styles from "./account-overview.module.css";

function dateLabel(value?: number) {
  return value ? new Date(value).toLocaleDateString("ko-KR") : "아직 없어요";
}

export function AccountOverview() {
  const auth = useAuth();
  const collection = useCollection();
  const local = useSavedSession();
  const saved = useAccountResults();
  const [confirm, dialog] = useConfirm();
  const [deleting, setDeleting] = useState(false);
  const deletionLock = useRef(false);
  const [notice, setNotice] = useState("");
  const signedIn = auth.status === "authenticated";
  const records = signedIn
    ? [...saved.results].sort(
        (a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0),
      )
    : auth.status === "anonymous"
      ? [local.first, local.session].filter((s) => s?.result)
      : [];
  const first = records[0];
  const latest = records.at(-1);
  const type = signedIn ? collection.data.firstType : local.first?.result;
  const character = type ? CHARACTERS[type] : null;
  const waiting =
    auth.busy || (signedIn && (!collection.loaded || !saved.loaded));

  async function deleteAccount() {
    if (deletionLock.current) return;
    deletionLock.current = true;
    const accepted = await confirm({
      title: "계정과 도감을 삭제할까요?",
      description:
        "이 서비스의 계정, 검사 답변·점수, 수집한 캐릭터, 초대 코드와 모든 로그인 세션을 삭제해요.",
      note: "탈퇴 후 7일간 재가입할 수 없고, 기존 데이터는 복원되지 않아요. 재가입해도 신규 초대 보상은 받을 수 없어요. 이를 확인하는 최소 식별값과 탈퇴 시각은 서비스 운영 기간 동안 별도로 보관해요. 친구에게 이미 지급된 캐릭터는 유지되고 이 브라우저의 검사 기록은 지워요. 카카오 계정 자체는 삭제되지 않아요.",
      confirmLabel: "계정·도감 삭제",
      tone: "danger",
    });
    if (!accepted) {
      deletionLock.current = false;
      return;
    }
    setDeleting(true);
    setNotice("");
    try {
      const response = await fetch("/api/collection/account", {
        method: "DELETE",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("delete_failed");
      auth.signedOut();
      clearSession();
      window.location.reload();
    } catch {
      setNotice(
        "계정 삭제 완료 여부를 확인하지 못했어요. 잠시 후 로그인 상태를 확인하고 다시 시도해 주세요.",
      );
    } finally {
      deletionLock.current = false;
      setDeleting(false);
    }
  }

  return (
    <main id="main" className={`catalog-shell ${styles.page}`}>
      <header className={`page-intro ${styles.intro}`}>
        <div>
          <span className="eyebrow">나의 공부 공간</span>
          <h1>
            내 <span className="accent-text">정보</span>
          </h1>
          <p>
            함께한 공부캐도, 차곡차곡 쌓인 기록도.
            <br />
            나의 공부 이야기를 여기서 이어가요.
          </p>
        </div>
        <Image
          src="/ui-icons/nav-account.webp"
          alt=""
          width={180}
          height={180}
          priority
        />
      </header>
      <div className={styles.grid}>
        <section
          className={`${styles.card} ${styles.login} ${styles.wide}`}
          aria-labelledby="account-login-title"
        >
          <h2 id="account-login-title">
            <span className={styles.statusDot} />
            로그인 상태
          </h2>
          <p role="status">
            {auth.message ||
              (signedIn
                ? "카카오 계정으로 로그인했어요."
                : "로그인하면 검사 기록과 도감을 다른 기기에서도 이어볼 수 있어요.")}
          </p>
          {auth.status === "error" ? (
            <button
              className="button secondary"
              onClick={() => void auth.refresh()}
            >
              로그인 상태 다시 확인
            </button>
          ) : (
            !signedIn && (
              <button
                className="button primary"
                disabled={auth.busy || !auth.session.configured}
                onClick={() => void auth.login()}
              >
                카카오 로그인
              </button>
            )
          )}
          {!auth.busy &&
            auth.status === "anonymous" &&
            !auth.session.configured && (
              <p className="small muted">카카오 로그인을 준비 중이에요.</p>
            )}
          {signedIn && (
            <p className="small muted">
              카카오 이름이나 이메일은 이 서비스에 저장하지 않아요.
            </p>
          )}
        </section>
        <section
          className={styles.card}
          aria-labelledby="account-character-title"
        >
          <h2 id="account-character-title">
            <Image
              src="/ui-icons/nav-collection.webp"
              alt=""
              width={40}
              height={40}
            />
            나의 공부캐
          </h2>
          {waiting ? (
            <p role="status">나의 공부캐를 확인하고 있어요…</p>
          ) : auth.status === "error" || (signedIn && collection.error) ? (
            <>
              <p>나의 공부캐를 불러오지 못했어요.</p>
              <button
                className="button secondary"
                onClick={() => void collection.refresh()}
              >
                다시 불러오기
              </button>
            </>
          ) : (
            <>
              <div className={styles.portrait}>
                <Image
                  src={
                    (type && getType(type)?.asset) ||
                    "/ui-icons/nav-character.webp"
                  }
                  alt={
                    character
                      ? `${character.name}, 나의 첫 공부캐`
                      : "나의 공부캐를 찾아봐요"
                  }
                  width={240}
                  height={240}
                  sizes="(max-width: 767px) 160px, 200px"
                />
              </div>
              <p className={styles.character}>
                {character ? character.name : "첫 공부 친구를 만나볼까요?"}
              </p>
              <p className="small muted">
                {character
                  ? character.line
                  : "검사로 나의 공부 취향을 알아보고 첫 캐릭터를 도감에 보관해요."}
              </p>
              <Link
                className="button secondary"
                href={character || signedIn ? "/collection" : "/quiz"}
              >
                {character || signedIn ? "내 도감 보기" : "내 캐 찾기"}
              </Link>
            </>
          )}
        </section>
        <section
          className={`${styles.card} ${styles.records}`}
          aria-labelledby="account-records-title"
        >
          <h2 id="account-records-title">
            <Image
              src="/ui-icons/nav-skills.webp"
              alt=""
              width={40}
              height={40}
            />
            검사 기록
          </h2>
          {waiting ? (
            <p role="status">검사 기록을 확인하고 있어요…</p>
          ) : (
            <>
              {auth.status !== "error" && !saved.error && (
                <dl className={styles.dates}>
                  <div>
                    <dt>처음 보관한 검사</dt>
                    <dd>{dateLabel(first?.completedAt)}</dd>
                  </div>
                  <div>
                    <dt>최근 검사</dt>
                    <dd>{dateLabel(latest?.completedAt)}</dd>
                  </div>
                </dl>
              )}
              {signedIn ? (
                <SavedResults history />
              ) : auth.status === "anonymous" ? (
                <>
                  <p>
                    이 브라우저에 보관한 기록이에요. 로그인하면 계정에 저장할 수
                    있어요.
                  </p>
                  {latest?.result && (
                    <Link className="button secondary" href="/result">
                      내 결과 보기
                    </Link>
                  )}
                </>
              ) : (
                <p>로그인 상태를 확인한 뒤 기록을 볼 수 있어요.</p>
              )}
            </>
          )}
          <p className={styles.note}>
            다시 검사하면 새 답변과 결과를 확인할 수 있어요. 처음 만난 캐릭터와
            도감은 유지되고, 재검사로 새 카드를 받지는 않아요.
          </p>
        </section>
        <section
          className={`${styles.card} ${styles.wide}`}
          aria-labelledby="account-settings-title"
        >
          <h2 id="account-settings-title">
            <Image
              src="/ui-icons/nav-account.webp"
              alt=""
              width={40}
              height={40}
            />
            계정 관리
          </h2>
          <div className={styles.setting}>
            <div>
              <h3>이 브라우저의 기록</h3>
              <p>
                이 기기의 검사 기록을 지워요. 계정에 저장된 검사 결과와 도감은
                유지돼요.
              </p>
            </div>
            <ClearRecords />
          </div>
          {signedIn && (
            <>
              <div className={styles.setting}>
                <div>
                  <h3>로그아웃</h3>
                  <p>계정에 저장된 기록은 다음 로그인 때 다시 볼 수 있어요.</p>
                </div>
                <button
                  className="button secondary"
                  disabled={auth.busy || deleting}
                  onClick={() => void auth.logout()}
                >
                  로그아웃
                </button>
              </div>
              <div className={styles.setting}>
                <div>
                  <h3>계정 삭제</h3>
                  <p>
                    계정과 도감, 검사 결과를 삭제해요. 삭제 후 7일간 재가입할 수
                    없어요.
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={auth.busy || deleting}
                  onClick={() => void deleteAccount()}
                >
                  {deleting ? "삭제 중…" : "계정·도감 삭제"}
                </button>
              </div>
            </>
          )}
          {notice && <p role="alert">{notice}</p>}
          <Link className="text-link" href="/privacy">
            개인정보 처리 및 보관 안내 →
          </Link>
        </section>
      </div>
      {dialog}
    </main>
  );
}
