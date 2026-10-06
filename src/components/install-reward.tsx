"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useSkills, SKILL_ERRORS } from "./skill-provider";
import { useAuth } from "./auth-provider";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function InstallReward() {
  const skills = useSkills();
  const auth = useAuth();
  const prompt = useRef<InstallPrompt | null>(null);
  const helpId = useId();
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [env, setEnv] = useState({
    mobile: false,
    standalone: false,
    ios: false,
    kakao: false,
    ready: false,
  });
  const [help, setHelp] = useState<"install" | "shortcut" | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const actionLock = useRef(false);
  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const check = () => {
      const ios =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setEnv({
        mobile: /Android/i.test(navigator.userAgent) || ios,
        standalone:
          query.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
        ios,
        kakao: /KAKAOTALK/i.test(navigator.userAgent),
        ready: true,
      });
    };
    const frame = requestAnimationFrame(check);
    const available = (e: Event) => {
      e.preventDefault();
      prompt.current = e as InstallPrompt;
      setCanInstall(true);
    };
    const complete = () => {
      prompt.current = null;
      setCanInstall(false);
      setInstalled(true);
      check();
    };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    query.addEventListener("change", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
      query.removeEventListener("change", check);
    };
  }, []);
  async function install() {
    const pending = prompt.current;
    if (actionLock.current || !pending || env.kakao) return;
    actionLock.current = true;
    prompt.current = null;
    setCanInstall(false);
    setBusy(true);
    setMessage("");
    try {
      await pending.prompt();
      const choice = await pending.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "설치가 완료되면 홈 화면의 StudyCrew 아이콘으로 실행해 주세요."
          : "설치를 취소했어요. 지금처럼 웹으로 계속 이용할 수 있어요.",
      );
    } catch {
      setMessage(
        "설치 창을 열지 못했어요. 설치 방법을 확인하거나 웹으로 계속 이용해 주세요.",
      );
      setHelp("install");
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  async function claim(kind: "install" | "shortcut" = "install") {
    if (
      actionLock.current ||
      !env.mobile ||
      (kind === "install" ? !env.standalone : !confirmed)
    )
      return;
    actionLock.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (!skills.signedIn) {
        await auth.login();
        return;
      }
      const result = await skills.act(
        kind === "install"
          ? { action: "install", standalone: true, mobile: true }
          : { action: "shortcut", confirmed: true },
      );
      setMessage(
        result.awarded
          ? `홈 화면 선물, 하트 ${result.awarded}개가 도착했어요!`
          : "이 선물은 이미 받았어요.",
      );
    } catch (e) {
      setMessage(
        SKILL_ERRORS[(e as Error).message] ??
          "선물을 받지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(location.origin + "/methods");
      setMessage("주소를 복사했어요. Safari 또는 Chrome에서 열어 주세요.");
    } catch {
      setMessage("주소창의 링크를 복사해 외부 브라우저에서 열어 주세요.");
    }
  }
  if (!env.ready || !env.mobile) return null;
  const appOpen = env.standalone;
  return (
    <div className="install-reward">
      <Image src="/skills/heart.webp" width={36} height={36} alt="" />
      <div className="install-reward-content">
        <strong>홈 화면 선물 · 최대 하트 3개</strong>
        <p>
          바로가기를 추가하면 <b>하트 1개</b>, 이후 앱을 설치하면 <b>2개 더!</b>{" "}
          앱부터 설치하면 한 번에 3개를 받아요. 계정당 총 3개까지 받을 수
          있어요.
        </p>
        {skills.progress.shortcutClaimed && !skills.progress.installClaimed && (
          <p className="skill-earned">
            바로가기 선물 1개 받음 · 앱 설치 시 2개 더!
          </p>
        )}
        {appOpen ? (
          <>
            <span className="skill-earned">설치된 앱으로 이용 중</span>
            {!skills.progress.installClaimed && (
              <div className="install-actions">
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    auth.busy ||
                    (skills.signedIn && (!skills.loaded || skills.error))
                  }
                  onClick={() => void claim()}
                >
                  {busy
                    ? "확인 중…"
                    : skills.signedIn
                      ? "설치 선물 받기"
                      : "로그인하고 선물 받기"}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {installed ? (
              <p className="skill-earned">
                설치가 완료됐어요. 홈 화면의 StudyCrew 아이콘으로 실행해 주세요.
              </p>
            ) : (
              <div className="install-actions">
                <button
                  className="button primary"
                  disabled={busy || !canInstall || env.kakao}
                  onClick={() => void install()}
                >
                  {busy ? "설치 창 확인 중…" : "앱 설치하기"}
                </button>
                <button
                  className="button secondary"
                  aria-expanded={help === "install"}
                  aria-controls={helpId}
                  onClick={() => setHelp(help === "install" ? null : "install")}
                >
                  앱 설치 방법 보기
                </button>
              </div>
            )}
            {!installed && (!canInstall || env.kakao) && (
              <p className="install-availability">
                이 환경에서는 설치 버튼을 사용할 수 없어요. 설치 방법에서
                브라우저 메뉴를 확인해 주세요.
              </p>
            )}
            {!env.ios && (
              <button
                className="text-link install-shortcut"
                aria-expanded={help === "shortcut"}
                aria-controls={helpId}
                onClick={() => setHelp(help === "shortcut" ? null : "shortcut")}
              >
                설치 없이 웹페이지 바로가기 만들기
              </button>
            )}
          </>
        )}
        {skills.progress.installClaimed && (
          <span className="skill-earned install-claimed">설치 선물 받음</span>
        )}
        {help && (
          <div className="install-help" id={helpId}>
            <strong>
              {help === "shortcut"
                ? "웹페이지 바로가기 만들기"
                : "앱 설치 방법"}
            </strong>
            {env.kakao && (
              <p>
                먼저 카카오톡 메뉴의 <strong>다른 브라우저로 열기</strong>로
                Chrome 또는 Safari에서 이 페이지를 열어 주세요.
              </p>
            )}
            {env.ios ? (
              <ol>
                <li>Safari에서 이 페이지를 열어요.</li>
                <li>
                  공유 메뉴에서 <strong>홈 화면에 추가</strong>를 선택해요.
                </li>
                <li>추가된 StudyCrew 아이콘으로 실행해요.</li>
              </ol>
            ) : (
              <ol>
                <li>Chrome에서 이 페이지를 열어요.</li>
                <li>
                  오른쪽 위 <strong>⋮ → 설치 및 바로가기 만들기</strong>를
                  선택해요.
                </li>
                <li>
                  <strong>
                    {help === "shortcut" ? "바로가기 만들기 → 추가" : "설치"}
                  </strong>
                  를 선택해요.
                </li>
              </ol>
            )}
            {help === "shortcut" ? (
              <>
                <p>
                  바로가기 아이콘을 누르면 Chrome에서 웹페이지가 열려요. 추가를
                  마친 뒤 아래에서 확인하면 하트 1개를 받아요.
                </p>
                {!skills.progress.shortcutClaimed &&
                  !skills.progress.installClaimed && (
                    <div className="shortcut-claim">
                      <label>
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />{" "}
                        홈 화면에 바로가기를 추가했어요
                      </label>
                      <p className="install-availability">
                        브라우저에서 완료 여부를 알려주지 않아 직접 확인을
                        받아요.
                      </p>
                      <button
                        className="button primary"
                        disabled={
                          !confirmed ||
                          busy ||
                          auth.busy ||
                          (skills.signedIn && (!skills.loaded || skills.error))
                        }
                        onClick={() => void claim("shortcut")}
                      >
                        {busy
                          ? "확인 중…"
                          : skills.signedIn
                            ? "바로가기 선물 받기 · 하트 1개"
                            : "로그인하고 바로가기 선물 받기"}
                      </button>
                    </div>
                  )}
                {skills.progress.shortcutClaimed && (
                  <p className="skill-earned">바로가기 선물 받음</p>
                )}
                {skills.progress.installClaimed && (
                  <p className="skill-earned">
                    홈 화면 선물 3개를 모두 받았어요.
                  </p>
                )}
              </>
            ) : (
              <p>
                설치 후에는 홈 화면의 StudyCrew 아이콘으로 실행해 주세요. 설치
                버튼을 누르는 것만으로 하트가 지급되지는 않아요.
              </p>
            )}
            {!env.ios && (
              <a
                className="text-link"
                href={`https://support.google.com/chrome/answer/${help === "shortcut" ? "15085120" : "9658361"}?hl=ko&co=GENIE.Platform%3DAndroid`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chrome 공식 안내 보기 ↗
              </a>
            )}
            {env.kakao && (
              <button className="text-link" onClick={() => void copyAddress()}>
                앱 주소 복사
              </button>
            )}
            <details className="install-warning">
              <summary>설치 중 위험 경고가 표시되나요?</summary>
              <p>
                설치를 취소하고 웹페이지로 계속 이용해 주세요. 경고를 무시하거나
                기기의 보호 기능을 끄지 마세요. 경고 원인이 확인되기 전까지는
                설치를 진행하지 않는 것이 좋습니다.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setHelp(null);
                  setMessage("설치 없이 지금 화면에서 계속 이용할 수 있어요.");
                }}
              >
                웹으로 계속 이용하기
              </button>
            </details>
          </div>
        )}
        {(message || auth.message) && (
          <p role="status">{message || auth.message}</p>
        )}
      </div>
    </div>
  );
}
