"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getMethod, methodOwner, type MethodId } from "@/lib/methods";
import { skillPrice } from "@/lib/skill-economy";
import { useSkills, SKILL_ERRORS } from "./skill-provider";
import { useAuth } from "./auth-provider";
import { InstallReward } from "./install-reward";

export function Heart({ size = 24 }: { size?: number }) {
  return (
    <Image
      src="/skills/heart.webp"
      width={size}
      height={size}
      alt=""
      className="heart-icon"
    />
  );
}
export function SkillLock({
  cost,
  size = 100,
  open = false,
}: {
  cost: 1 | 2 | 3;
  size?: number;
  open?: boolean;
}) {
  return (
    <Image
      src={`/skills/lock-${open ? "open" : cost}.webp`}
      width={size}
      height={size}
      style={{ objectFit: "contain", width: size, height: size }}
      alt={open ? "열린 자물쇠" : `하트 ${cost}개로 여는 자물쇠`}
    />
  );
}
export function SkillWallet({ history = false }: { history?: boolean }) {
  const { progress, loaded, error, signedIn, refresh } = useSkills();
  const names = {
    card: "새 카드 보상",
    unlock: "스킬 열기",
    refund: "시그니처 하트 돌려받기",
    install: "앱 설치 선물",
    shortcut: "홈 화면 바로가기 선물",
    practice: "첫 실천 완료",
  };
  return (
    <section className="skill-wallet" aria-label="나의 하트와 스킬">
      <div className="skill-wallet-top">
        <div>
          <span className="eyebrow">MY SKILL BOOK</span>
          <h2>하트로 여는 나의 가능성</h2>
          <p>카드로 만나고, 스킬로 익히고, 나만의 공부법으로.</p>
        </div>
        <div className="heart-balance">
          <Heart size={40} />
          <strong>{!loaded || error ? "—" : progress.balance}</strong>
          <span>하트</span>
        </div>
      </div>
      <div className="skill-wallet-stats">
        <span>
          열린 스킬 <b>{progress.unlocked.length} / 28</b>
        </span>
        <span>
          첫 실천 완료 <b>{progress.practiced.length} / 28</b>
        </span>
      </div>
      {error ? (
        <p role="status">
          하트를 불러오지 못했어요.{" "}
          <button className="text-link" onClick={() => void refresh()}>
            다시 확인
          </button>
        </p>
      ) : !signedIn ? (
        <p>
          로그인하고 첫 카드를 저장하면{" "}
          <strong>하트 1~3개와 나의 시그니처 스킬</strong>을 받아요.
        </p>
      ) : (
        <p>
          새 카드마다 <strong>1~3개</strong> · 스킬별 첫 10분 실천과 응답 완료
          시 <strong>1개</strong>
        </p>
      )}
      <InstallReward />
      {history && signedIn && (
        <details className="heart-history">
          <summary>하트 적립·사용 내역</summary>
          {progress.entries.length ? (
            <ol>
              {progress.entries.map((e) => (
                <li key={e.id}>
                  <span>
                    {names[e.reason]}
                    {["unlock", "refund", "practice"].includes(e.reason) && (
                      <small>{getMethod(e.reference as MethodId)?.name}</small>
                    )}
                    <small>
                      {new Date(e.createdAt).toLocaleString("ko-KR")}
                    </small>
                  </span>
                  <strong data-positive={e.amount > 0}>
                    {e.amount > 0 ? "+" : ""}
                    {e.amount}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p>아직 하트 내역이 없어요.</p>
          )}
        </details>
      )}
    </section>
  );
}
export function SkillGate({
  id,
  children,
  onCancel,
}: {
  id: MethodId;
  children: ReactNode;
  onCancel?: () => void;
}) {
  const skills = useSkills();
  const auth = useAuth();
  const price = skillPrice(id);
  const method = getMethod(id);
  const opened = skills.progress.unlocked.includes(id);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [revealing, setRevealing] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!revealing) return;
    const clip = video.current;
    const finish = () => setRevealing(false);
    const timer = setTimeout(finish, 12000);
    if (clip) void clip.play().catch(finish);
    else finish();
    return () => {
      clearTimeout(timer);
      clip?.pause();
    };
  }, [revealing]);
  async function unlock() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await skills.act({ action: "unlock", method: id });
      setRevealing(
        result.outcome !== "already_open" &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
      setMessage("새 스킬이 열렸어요! 이제 나만의 방법으로 익혀 보세요.");
    } catch (e) {
      setMessage(
        SKILL_ERRORS[(e as Error).message] ??
          "열리지 않았어요. 다시 시도해 주세요.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (opened && !revealing && !busy)
    return (
      <div className="skill-open-content">
        {message && (
          <p role="status" className="skill-success">
            {message}
          </p>
        )}
        {children}
      </div>
    );
  return (
    <section
      className={`skill-gate${revealing ? " is-unlocking" : ""}`}
      aria-busy={busy || revealing}
    >
      <span className="eyebrow">
        {revealing ? "나의 스킬이 되는 순간" : "새로운 공부법을 열어 볼까요?"}
      </span>
      <div className="skill-lock-stage">
        {revealing ? (
          <video
            ref={video}
            className="skill-unlock-video"
            src={`/skills/unlock-${price}.mp4`}
            poster={`/skills/unlock-${price}-poster.webp`}
            muted
            playsInline
            autoPlay
            preload="auto"
            aria-label={`하트 ${price}개가 빈 칸을 채우고 자물쇠가 열리는 영상`}
            onEnded={() => setRevealing(false)}
            onError={() => setRevealing(false)}
          />
        ) : (
          <SkillLock cost={price} size={116} />
        )}
      </div>
      <h2>{method.name}</h2>
      {revealing ? (
        <>
          <p role="status">하트가 쏙! 새로운 스킬이 열리고 있어요.</p>
          <button className="text-link" onClick={() => setRevealing(false)}>
            바로 카드 보기
          </button>
        </>
      ) : (
        <>
          <p className="skill-gate-description">
            하트 <strong>{price}개</strong>를 사용해 이 스킬을 열까요?
          </p>
          {!skills.signedIn ? (
            <button
              className="button primary"
              disabled={auth.busy}
              onClick={() => void auth.login()}
            >
              카카오 로그인하고 시작하기
            </button>
          ) : (
            <>
              <button
                className="button skill-unlock-button"
                disabled={
                  busy ||
                  !skills.loaded ||
                  skills.error ||
                  skills.progress.balance < price
                }
                onClick={() => void unlock()}
              >
                <Heart />
                {busy ? "자물쇠 여는 중…" : `하트 ${price}개 사용해 열기`}
              </button>
              {onCancel && (
                <button
                  className="button secondary skill-unlock-cancel"
                  disabled={busy}
                  onClick={onCancel}
                >
                  다음에 할게요
                </button>
              )}
              <p className="small">
                보유 {skills.progress.balance}개
                {skills.progress.balance >= price &&
                  ` → 열고 나면 ${skills.progress.balance - price}개`}
              </p>
              {skills.progress.balance < price && (
                <p className="small">
                  열린 스킬을 처음 실천하거나, 새 카드·앱 설치 선물로 하트를
                  모아 보세요.
                </p>
              )}
              {skills.error && (
                <button
                  className="text-link"
                  onClick={() => void skills.refresh()}
                >
                  연결 다시 확인
                </button>
              )}
            </>
          )}
          {(message || auth.message) && (
            <p role="status">{message || auth.message}</p>
          )}
          {methodOwner(id).kind === "signature" && (
            <p className="small muted">
              해당 캐릭터 카드가 있어도 열려요.
              <br />
              하트로 먼저 열었다면 카드를 만날 때 3개를 돌려드려요.
            </p>
          )}
          <div className="skill-gate-links">
            <Link href="/collection">캐릭터 만나러 가기 →</Link>
            <Link href="/methods#skill-wallet">하트 모으는 방법 →</Link>
          </div>
        </>
      )}
    </section>
  );
}
