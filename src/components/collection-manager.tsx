"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { useCollection } from "./collection-provider";
import { useSavedSession } from "./use-saved-session";
import { GiftBox, RewardReveal } from "./reward-reveal";
import { Share } from "./share";
import { collectionProgress } from "@/lib/collection-progress";
import { SavedResults } from "./saved-results";
import { useAccountResults } from "./account-results-provider";
import { notifyAuthChange, useAuth } from "./auth-provider";
import styles from "./collection-manager.module.css";
import { useSkills } from "./skill-provider";
import { useGoods } from "./goods-provider";

export function CollectionNudge() {
  const { data } = useCollection();
  return (
    <section className="collection-nudge">
      <div>
        <span className="eyebrow">처음 만난 친구부터, 하나씩</span>
        <h2>
          {data.firstType
            ? "친구를 초대하고, 도감을 채워봐요."
            : "이 친구를 도감에 저장해둘까요?"}
        </h2>
        <p>
          {data.firstType
            ? "새 친구가 첫 검사 결과를 계정에 저장하면, 아직 만나지 않은 캐릭터 한 명이 찾아와요."
            : "첫 캐릭터는 로그인 없이 만날 수 있어요. 카카오 로그인 후 처음 도감에 저장하면 하트 1~3개, 별 1~2개와 이 친구의 시그니처 스킬을 받아요."}
        </p>
      </div>
      <Link className="button primary" href="/collection">
        {data.firstType ? "내 도감과 초대 코드 보기" : "내 도감 시작하기"} →
      </Link>
    </section>
  );
}
const ERRORS: Record<string, string> = {
  invalid_invite:
    "추천 코드를 확인해 주세요. 유효한 코드를 입력하거나 비워둘 수 있어요.",
  self_invite: "내 추천 코드로 나를 초대할 수는 없어요.",
  run_claimed:
    "이 검사 결과는 이미 다른 계정에 저장됐어요. 본인의 계정으로 로그인해 주세요.",
  first_result_required:
    "저장할 첫 결과가 없거나 보관 기간이 지났어요. 다시 검사해 주세요.",
  unauthorized: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  rate_limit: "요청이 많아 잠시 쉬고 있어요. 조금 뒤 다시 시도해 주세요.",
};
export function CollectionManager() {
  const skills = useSkills();
  const goods = useGoods();
  const authState = useAuth();
  const completionShown = useRef(false);
  const { data, loaded, error, refresh } = useCollection();
  const { first: localFirst } = useSavedSession();
  const { results } = useAccountResults();
  const first = localFirst ?? results.filter((s) => !s.isRetake).at(-1) ?? null;
  const [code, setCode] = useState("");
  const [captured, setCaptured] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState<{
    code: string;
    bonus: boolean;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const check = async () => {
      try {
        const response = await fetch("/api/referrals", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.ok) {
          const result = await response.json();
          setCaptured(result.code);
        }
      } catch {
        /* 추천 코드는 등록 시 서버에서 다시 확인 */
      }
    };
    void check();
    window.addEventListener("study:invite", check);
    const resetBusy = () => setBusy(false);
    window.addEventListener("pageshow", resetBusy);
    const auth = new URLSearchParams(location.search).get("auth");
    const messages: Record<string, string> = {
      cancelled: "로그인을 취소했어요. 검사 결과는 그대로예요.",
      expired: "로그인 시간이 지났어요. 다시 시도해 주세요.",
      failed: "로그인을 마치지 못했어요. 다시 시도해 주세요.",
      unavailable:
        "지금은 도감 로그인을 준비하고 있어요. 검사는 계속 이용할 수 있어요.",
      rejoin_blocked: "탈퇴 후 7일 동안은 다시 가입할 수 없어요.",
    };
    if (auth === "rejoin_blocked") {
      const retryAt = new Date(
        new URLSearchParams(location.search).get("retryAt") ?? "",
      );
      if (Number.isFinite(retryAt.getTime()))
        messages.rejoin_blocked += ` ${retryAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국 시간)부터 다시 가입할 수 있어요.`;
    }
    if (auth && messages[auth])
      requestAnimationFrame(() => setNotice(messages[auth]));
    return () => {
      controller.abort();
      window.removeEventListener("study:invite", check);
      window.removeEventListener("pageshow", resetBusy);
    };
  }, []);
  useEffect(() => {
    if (
      completionShown.current ||
      authState.status !== "authenticated" ||
      new URLSearchParams(location.search).get("auth") !== "success"
    )
      return;
    const frame = requestAnimationFrame(() => {
      completionShown.current = true;
      notifyAuthChange();
      setLoginSuccess(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [authState.status]);
  async function action(path: string, payload?: unknown) {
    setBusy(true);
    setNotice("");
    setLoginSuccess(false);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          ERRORS[result.error] ??
            "저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
        );
      await refresh();
      await skills.refresh();
      await goods.refresh();
      if (result.hearts?.length)
        setNotice(
          `카드를 저장했어요! 하트 ${result.hearts.reduce((sum: number, h: { amount: number }) => sum + h.amount, 0)}개와 시그니처 스킬을 받았어요.`,
        );
      return result;
    } catch (failure) {
      setNotice(
        failure instanceof Error
          ? failure.message
          : "잠시 후 다시 시도해 주세요.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  const ownType = data.firstType ? getType(data.firstType) : null;
  const displayNotice =
    notice ||
    (loginSuccess && authState.status === "authenticated"
      ? "카카오 로그인이 완료됐어요. 검사 결과와 캐릭터 카드를 계정에 보관할 수 있어요."
      : "");
  const progress = collectionProgress(data, first?.result);
  return (
    <>
      <section
        className={`collection-panel ${styles.notebook}`}
        aria-label="내 도감 관리"
      >
        <div className="collection-panel-heading">
          <span className="eyebrow">공부 친구 수집 노트</span>
          <span className="collection-count">
            {progress.collected}
            <small> / {progress.total}</small>
          </span>
        </div>
        <h2 id="collection-heading" tabIndex={-1}>
          {progress.unlocked
            ? "열여섯 친구, 모두 만났어요!"
            : data.firstType
              ? "친구의 발견이, 나의 새 친구로."
              : "처음 만난 친구를 오래 간직해요."}
        </h2>
        <p className={styles.intro}>
          검사는 <strong>자유롭게</strong>, 도감은{" "}
          <strong>내 계정에 안전하게</strong>.
          <br />내 공부캐 <strong>1명</strong>에 친구 초대로{" "}
          <strong>{progress.inviteGoal}명</strong>을 더하면, 모두{" "}
          <strong className={styles.total}>{progress.total}명</strong>이에요.
        </p>
        {authState.busy ? (
          <p role="status" aria-busy="true">
            <span className="loading-dot" aria-hidden="true" />{" "}
            {authState.message}
          </p>
        ) : !loaded ? (
          <p role="status">내 도감을 불러오고 있어요.</p>
        ) : error ? (
          <div role="status">
            <p>
              {authState.status === "error"
                ? authState.message
                : "도감을 불러오지 못했어요. 저장된 카드가 없어진 것은 아니에요."}
            </p>
            <button className="button secondary" onClick={() => void refresh()}>
              다시 불러오기
            </button>
          </div>
        ) : !data.signedIn ? (
          <>
            <form
              action="/api/auth/kakao/start"
              method="post"
              onSubmit={(event) => {
                event.preventDefault();
                void authState.login();
              }}
            >
              <button
                className="button kakao-login"
                disabled={!data.configured || busy}
                aria-busy={busy}
                aria-label="카카오 로그인"
              >
                <Image
                  src="/kakao-login.svg"
                  alt=""
                  width={224}
                  height={46}
                  unoptimized
                />
              </button>
            </form>
            <p className="small muted">
              검사 답변·점수가 <strong>계정에 저장</strong>돼요. 같은 계정으로
              로그인하면 <strong>결과와 도감이 돌아와요.</strong>
            </p>
            {!data.configured && (
              <p className="notice" role="status">
                도감 로그인을 준비 중이에요. 첫 검사와 결과 보기는 지금도 이용할
                수 있어요.
              </p>
            )}
            <Link href="/quiz" className="text-link">
              로그인 없이 검사하기 →
            </Link>
          </>
        ) : !data.firstType ? (
          <>
            {first?.result ? (
              <>
                <p className="collection-first-name">
                  처음 만난 <strong>{CHARACTERS[first.result].name}</strong>를
                  이 계정에 저장해요.
                </p>
                {!data.referralEligible ? (
                  <p className="notice">
                    재가입 계정은 신규 가입 초대 보상 대상이 아니에요. 첫
                    캐릭터를 저장하고 새 친구를 초대할 수는 있어요.
                  </p>
                ) : captured ? (
                  <p className="invite-captured">
                    초대 코드 <strong>{captured}</strong>가 연결됐어요. 첫
                    저장을 마치면 나에게 보너스 캐릭터 1명, 친구에게도 새
                    캐릭터가 도착해요.
                  </p>
                ) : (
                  <label className="invite-input">
                    친구에게 받은 추천 코드 <span>(선택)</span>
                    <input
                      value={code}
                      onChange={(e) =>
                        setCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-F0-9]/g, "")
                            .slice(0, 10),
                        )
                      }
                      maxLength={10}
                      autoComplete="off"
                      placeholder="10자리 초대 코드"
                    />
                  </label>
                )}
                <p className="small muted">
                  답변을 서버에서 검증하고 점수와 함께 계정에 보관해요. 저장 후
                  첫 캐릭터와 추천인은 바꿀 수 없어요.
                </p>
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    (data.referralEligible && !!code && code.length !== 10)
                  }
                  onClick={async () => {
                    const result = await action("/api/collection/register", {
                      session: first,
                      ...(data.referralEligible && code
                        ? { inviteCode: code }
                        : {}),
                    });
                    if (!result) return;
                    setNotice(
                      result.outcome === "referred"
                        ? "첫 친구와 보너스 친구를 저장했어요! 초대한 친구에게도 새 캐릭터가 전해졌어요."
                        : "첫 친구를 도감에 저장했어요!",
                    );
                    if (result.bonus)
                      setReward({ code: result.bonus, bonus: true });
                  }}
                >
                  {busy ? "도감에 저장하는 중…" : "첫 캐릭터 도감에 저장하기"}
                </button>
              </>
            ) : (
              <>
                <p>
                  아직 저장할 첫 검사 결과가 없어요. 검사를 마치고 다시
                  만나나요?
                </p>
                <Link className="button primary" href="/quiz">
                  첫 캐릭터 만나기 →
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <div className="collection-summary">
              <span>
                나의 첫 친구 <strong>{CHARACTERS[data.firstType].name}</strong>
              </span>
              <span>
                추천 성공 <strong>{data.referralCount}명</strong>
              </span>
              <span>
                도착한 선물 <strong>{data.pending.length}개</strong>
              </span>
            </div>
            <p className="collection-invite-progress">
              {progress.unlocked ? (
                <>
                  내 공부캐와 초대로 만난 <strong>15명</strong>,{" "}
                  <strong>도감을 모두 완성했어요!</strong>
                </>
              ) : progress.remainingInvites === 0 ? (
                <>
                  필요한 초대는 모두 완료했어요.{" "}
                  <strong>선물 {progress.pending}개만 개봉</strong>하면
                  완성이에요!
                </>
              ) : (
                <>
                  <strong>
                    {progress.remainingInvites}명의 친구가 첫 결과를 저장
                  </strong>
                  하면 초대가 완료돼요. 도착한 선물은{" "}
                  <strong>추가 초대 없이 개봉</strong>하면 돼요.
                </>
              )}
            </p>
            {data.pending.length > 0 && (
              <div className="reward-inbox" id="reward-inbox">
                <GiftBox small />
                <div>
                  <span className="reward-inbox-label">
                    GIFT ARRIVED · 초대 성공!
                  </span>
                  <h3>친구가 이어준 카드 선물!</h3>
                  <p>
                    <strong>미개봉 선물 {data.pending.length}개</strong> ·
                    카드팩마다 아직 없는 카드 한 장이 들어 있어요.
                  </p>
                </div>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={async () => {
                    const result = await action(
                      "/api/collection/rewards/open",
                      { id: data.pending[0].id },
                    );
                    if (result) setReward({ code: result.code, bonus: false });
                  }}
                >
                  {busy ? "선물 확인 중…" : "두근두근, 열어보기"}
                </button>
              </div>
            )}
            {!progress.unlocked && (
              <div className="invite-next-gift">
                <GiftBox small />
                <div>
                  <strong>
                    {progress.remainingInvites === 0
                      ? "도감 완성까지, 선물만 열면 돼요!"
                      : "다음 선물은 누구와 함께 열까요?"}
                  </strong>
                  <p>
                    {progress.remainingInvites === 0
                      ? "이미 도착한 선물을 모두 열면 스페셜 단체사진이 기다려요."
                      : "새 친구가 초대 링크로 첫 검사·로그인·도감 저장을 마치면, 나와 친구에게 카드가 한 장씩!"}
                  </p>
                  <span>
                    {progress.collected} / {progress.total}명 수집 · 중복 없이
                    모으는 나만의 도감
                  </span>
                </div>
              </div>
            )}
            <div className="invite-code-box">
              <span>나의 초대 코드</span>
              <strong>{data.inviteCode}</strong>
              <p>링크에 자동으로 담겨요. 친구가 직접 입력해도 돼요.</p>
            </div>
            <Share type={ownType!} kakaoLabel="내 공부캐 카카오톡 공유" />
            <p className={`small muted ${styles.conditions}`}>
              새 친구의{" "}
              <strong>첫 검사 완료 + 카카오 로그인 + 도감 저장</strong>까지
              마치면 <strong>추천 성공!</strong> 공유 버튼만 누르거나 같은
              계정이 재검사하면 <strong>보상은 추가되지 않아요.</strong>
            </p>
          </>
        )}
        {!authState.busy &&
          authState.status !== "error" &&
          authState.message && (
            <p role="status" className="notice">
              {authState.message}
            </p>
          )}
        {displayNotice && (
          <p role="status" className="notice">
            {displayNotice}
          </p>
        )}
      </section>
      {data.signedIn && (
        <details className={styles.records}>
          <summary>
            내 검사 기록 <span>필요할 때 펼쳐보기</span>
          </summary>
          <SavedResults history />
        </details>
      )}
      {reward && (
        <RewardReveal
          key={reward.code}
          code={reward.code}
          bonus={reward.bonus}
          collected={
            new Set([...data.cards.map((card) => card.code), reward.code]).size
          }
          total={progress.total}
          pending={data.pending.length}
          ownedCodes={[
            ...data.cards.map((card) => card.code),
            ...(data.firstType || first?.result
              ? [data.firstType || first!.result!]
              : []),
          ]}
          close={() => setReward(null)}
        />
      )}
    </>
  );
}
