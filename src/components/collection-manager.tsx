"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { clearSession } from "@/lib/storage";
import { useCollection } from "./collection-provider";
import { useSavedSession } from "./use-saved-session";
import { CharacterCard } from "./character-card";
import { MysteryCard } from "./mystery-card";
import { Share } from "./share";
import { useConfirm } from "./ui/confirm-dialog";
import { collectionProgress } from "@/lib/collection-progress";

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
            : "첫 캐릭터는 로그인 없이 만날 수 있어요. 저장하고 다른 친구들도 모으려면 카카오 로그인이 필요해요."}
        </p>
      </div>
      <Link className="button primary" href="/collection">
        {data.firstType ? "내 도감과 초대 코드 보기" : "내 도감 시작하기"} →
      </Link>
    </section>
  );
}
function RewardReveal({ code, close }: { code: string; close: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const type = getType(code)!;
  useEffect(() => {
    dialog.current?.showModal();
    const timer = setTimeout(() => setRevealed(true), 2200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <dialog
      className="reward-dialog"
      ref={dialog}
      aria-labelledby="reward-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <p className="eyebrow">친구의 첫 발견이 전해졌어요</p>
      <h2 id="reward-title" aria-live="polite">
        {revealed
          ? `${CHARACTERS[code].name}, 도감에 합류!`
          : "어떤 친구가 찾아왔을까요?"}
      </h2>
      <div className={revealed ? "reward-revealed" : "reward-waiting"}>
        {revealed ? (
          <CharacterCard type={type} priority />
        ) : (
          <MysteryCard type={type} priority />
        )}
      </div>
      {revealed && (
        <button className="button primary" onClick={close}>
          도감에서 만나기
        </button>
      )}
    </dialog>
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
  const { data, loaded, error, refresh } = useCollection();
  const { first } = useSavedSession();
  const [code, setCode] = useState("");
  const [captured, setCaptured] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();
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
    const auth = new URLSearchParams(location.search).get("auth");
    const messages: Record<string, string> = {
      cancelled: "로그인을 취소했어요. 검사 결과는 그대로예요.",
      expired: "로그인 시간이 지났어요. 다시 시도해 주세요.",
      failed: "로그인을 마치지 못했어요. 다시 시도해 주세요.",
      unavailable:
        "지금은 도감 로그인을 준비하고 있어요. 검사는 계속 이용할 수 있어요.",
    };
    if (auth && messages[auth])
      requestAnimationFrame(() => setNotice(messages[auth]));
    return () => {
      controller.abort();
      window.removeEventListener("study:invite", check);
    };
  }, []);
  async function action(path: string, payload?: unknown, method = "POST") {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(path, {
        method,
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
  const progress = collectionProgress(data, first?.result);
  return (
    <>
      <section className="collection-panel" aria-label="내 도감 관리">
        <div className="collection-panel-heading">
          <span className="eyebrow">공부 친구 수집 노트</span>
          <span className="collection-count">
            {progress.collected}
            <small> / {progress.total}</small>
          </span>
        </div>
        <h2>
          {progress.unlocked
            ? "열여섯 친구, 모두 만났어요!"
            : data.firstType
              ? "친구의 발견이, 나의 새 친구로."
              : "처음 만난 친구를 오래 간직해요."}
        </h2>
        <p>
          검사는 자유롭게, 도감은 내 계정에 안전하게.
          <br />내 공부캐 1명에 친구 초대로 {progress.inviteGoal}명을 더하면,
          모두 {progress.total}명이에요.
        </p>
        {!loaded ? (
          <p role="status">내 도감을 불러오고 있어요.</p>
        ) : error ? (
          <div role="status">
            <p>도감을 불러오지 못했어요. 저장된 카드가 없어진 것은 아니에요.</p>
            <button className="button secondary" onClick={() => void refresh()}>
              다시 불러오기
            </button>
          </div>
        ) : !data.signedIn ? (
          <>
            <form action="/api/auth/kakao/start" method="post">
              <button
                className="button kakao-login"
                disabled={!data.configured}
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
              이미 모은 도감도 같은 계정으로 로그인하면 돌아와요.
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
                {captured ? (
                  <p className="invite-captured">
                    초대 코드 <strong>{captured}</strong>가 연결됐어요. 첫
                    저장을 마치면 친구에게도 새 캐릭터가 도착해요.
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
                  완료 확인을 위해 답변을 잠깐 전송해 검증해요. 답변·상세 점수는
                  서버에 저장하지 않아요. 저장 후 첫 캐릭터와 추천인은 바꿀 수
                  없어요.
                </p>
                <button
                  className="button primary"
                  disabled={busy || (!!code && code.length !== 10)}
                  onClick={async () => {
                    const result = await action("/api/collection/register", {
                      session: first,
                      ...(code ? { inviteCode: code } : {}),
                    });
                    if (result)
                      setNotice(
                        result.outcome === "referred"
                          ? "첫 친구를 저장했어요! 초대한 친구에게도 발견이 전해졌어요."
                          : "첫 친구를 도감에 저장했어요!",
                      );
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
              {progress.unlocked
                ? "내 공부캐와 초대로 만난 15명, 도감을 모두 완성했어요!"
                : progress.remainingInvites === 0
                  ? `필요한 초대는 모두 완료했어요. 선물 ${progress.pending}개만 개봉하면 완성이에요!`
                  : `${progress.remainingInvites}명의 친구가 첫 결과를 저장하면 초대가 완료돼요. 도착한 선물은 추가 초대 없이 개봉하면 돼요.`}
            </p>
            {data.pending.length > 0 && (
              <div className="reward-inbox">
                <span aria-hidden="true">✦</span>
                <div>
                  <h3>새 공부 친구가 도착했어요!</h3>
                  <p>
                    선물 {data.pending.length}개가 기다리고 있어요. 중복 없이 한
                    명씩 만나요.
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
                    if (result) setReward(result.code);
                  }}
                >
                  {busy ? "선물 확인 중…" : "두근두근, 열어보기"}
                </button>
              </div>
            )}
            <div className="invite-code-box">
              <span>나의 초대 코드</span>
              <strong>{data.inviteCode}</strong>
              <p>링크에 자동으로 담겨요. 친구가 직접 입력해도 돼요.</p>
            </div>
            <Share type={ownType!} />
            <p className="small muted">
              새 친구의 첫 검사 완료 + 카카오 로그인 + 도감 저장까지 마치면 추천
              성공! 공유 버튼만 누르거나 같은 계정이 재검사하면 보상은 추가되지
              않아요.
            </p>
          </>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {data.signedIn && (
          <div className="collection-account-actions">
            <button
              className="text-link"
              disabled={busy}
              onClick={() => void action("/api/auth/logout")}
            >
              로그아웃
            </button>
            <button
              className="text-link muted"
              disabled={busy}
              onClick={async () => {
                if (
                  await confirm({
                    title: "계정과 도감을 삭제할까요?",
                    description:
                      "이 서비스의 계정, 수집한 캐릭터, 초대 코드와 모든 로그인 세션을 삭제해요.",
                    note: "복구할 수 없어요. 친구에게 이미 지급된 캐릭터는 유지되고, 이 기기의 검사 기록도 함께 지워요. 카카오 계정 자체를 삭제하는 것은 아니에요.",
                    confirmLabel: "계정·도감 삭제",
                    tone: "danger",
                  })
                ) {
                  const result = await action(
                    "/api/collection/account",
                    undefined,
                    "DELETE",
                  );
                  if (result) {
                    clearSession();
                    window.location.reload();
                  }
                }
              }}
            >
              계정·도감 삭제
            </button>
          </div>
        )}
      </section>
      {reward && (
        <RewardReveal
          key={reward}
          code={reward}
          close={() => setReward(null)}
        />
      )}
      {confirmDialog}
    </>
  );
}
