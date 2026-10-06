"use client";
import { useEffect, useRef, useState } from "react";
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
  const [env, setEnv] = useState({
    mobile: false,
    standalone: false,
    ios: false,
    kakao: false,
    ready: false,
  });
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const check = () =>
      setEnv({
        mobile:
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
        standalone:
          query.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
        ios:
          /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
        kakao: /KAKAOTALK/i.test(navigator.userAgent),
        ready: true,
      });
    const frame = requestAnimationFrame(check);
    const install = (e: Event) => {
      e.preventDefault();
      prompt.current = e as InstallPrompt;
    };
    window.addEventListener("beforeinstallprompt", install);
    query.addEventListener("change", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", install);
      query.removeEventListener("change", check);
    };
  }, []);
  async function act() {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (env.standalone) {
        if (!skills.signedIn) {
          await auth.login();
          return;
        }
        const r = await skills.act({
          action: "install",
          standalone: true,
          mobile: true,
        });
        setMessage(
          r.awarded
            ? "설치 선물, 하트 3개가 도착했어요!"
            : "설치 선물은 이미 받았어요.",
        );
      } else if (prompt.current) {
        await prompt.current.prompt();
        await prompt.current.userChoice;
        prompt.current = null;
        setHelp(true);
      } else setHelp((v) => !v);
    } catch (e) {
      setMessage(
        SKILL_ERRORS[(e as Error).message] ?? "설치 안내를 다시 열어 주세요.",
      );
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  if (!env.ready || !env.mobile) return null;
  return (
    <div className="install-reward">
      <Image src="/skills/heart.webp" width={36} height={36} alt="" />
      <div>
        <strong>홈 화면에서 만나요 · 하트 3개</strong>
        <p>설치한 앱으로 실행하고 로그인하면 한 번 받는 선물!</p>
        {!skills.progress.installClaimed && (
          <button
            className="button secondary"
            disabled={
              busy ||
              auth.busy ||
              (skills.signedIn && (!skills.loaded || skills.error))
            }
            onClick={() => void act()}
          >
            {busy
              ? "확인 중…"
              : env.standalone
                ? skills.signedIn
                  ? "설치 선물 받기"
                  : "로그인하고 선물 받기"
                : "앱 설치 방법 보기"}
          </button>
        )}
        {skills.progress.installClaimed && (
          <span className="skill-earned">설치 선물 받음</span>
        )}
        {help && (
          <div className="install-help">
            {env.kakao ? (
              <>
                <p>
                  카카오톡 메뉴에서 <strong>다른 브라우저로 열기</strong>를
                  선택해 주세요.
                </p>
                <button
                  className="text-link"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        location.origin + "/methods",
                      );
                      setMessage(
                        "주소를 복사했어요. Safari 또는 Chrome에서 열어 주세요.",
                      );
                    } catch {
                      setMessage(
                        "주소창의 링크를 복사해 외부 브라우저에서 열어 주세요.",
                      );
                    }
                  }}
                >
                  앱 주소 복사
                </button>
              </>
            ) : (
              <p>
                {env.ios
                  ? "Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택하고, 추가된 StudyCrew 아이콘을 눌러 주세요."
                  : "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택한 뒤 StudyCrew 아이콘으로 실행해 주세요."}
              </p>
            )}
            <p className="small">
              재설치하거나 다른 기기에 설치해도 선물은 계정당 한 번이에요.
            </p>
          </div>
        )}
        {message && <p role="status">{message}</p>}
      </div>
    </div>
  );
}
