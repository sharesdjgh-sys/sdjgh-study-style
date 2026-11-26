"use client";
import { requestSignal } from "@/lib/request-signal";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCollection } from "./collection-provider";
import { useAuth } from "./auth-provider";
import { usePwa } from "./pwa-provider";
import styles from "./onboarding.module.css";

export function InstallAppButton() {
  const pwa = usePwa();
  const auth = useAuth();
  if (
    !auth.session.signedIn ||
    !pwa.env.ready ||
    pwa.env.standalone ||
    pwa.installed
  )
    return null;
  return (
    <button type="button" className={styles.installLink} onClick={pwa.show}>
      앱 설치 안내
    </button>
  );
}

export function AppInstallPrompt() {
  const pwa = usePwa();
  const auth = useAuth();
  const { data, loaded, error } = useCollection();
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const attempted = useRef(new Set<string>());
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState("");
  const eligible =
    loaded &&
    !error &&
    auth.status === "authenticated" &&
    Boolean(data.firstType) &&
    pwa.env.ready &&
    pwa.env.mobile &&
    !pwa.env.standalone &&
    !pwa.installed &&
    ["/", "/collection", "/account"].includes(path);
  const show = pwa.show;
  const owner = auth.session.accountId;
  useEffect(() => {
    if (!eligible || !owner || attempted.current.has(owner)) return;
    let active = true;
    const timer = setInterval(async () => {
      // Let gift reveals and other dialogs finish before inviting installation.
      if (
        document.visibilityState !== "visible" ||
        document.querySelector("dialog[open], [aria-modal='true']")
      )
        return;
      attempted.current.add(owner);
      clearInterval(timer);
      try {
        const response = await fetch("/api/auth/install-prompt", {
          method: "POST",
          signal: requestSignal(10000),
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload.show === true) show();
      } catch {
        // Manual installation remains available when the invitation cannot be checked.
      }
    }, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [eligible, owner, show]);
  const visible =
    pwa.open && auth.status === "authenticated" && !pwa.env.standalone;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!visible) {
      element.close();
      return;
    }
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [visible]);
  function close() {
    pwa.hide();
    setHelp(false);
    setMessage("");
  }
  async function install() {
    if (!pwa.canInstall || pwa.env.kakao) {
      setHelp(true);
      return;
    }
    const outcome = await pwa.install();
    if (outcome === "accepted")
      setMessage("설치가 끝나면 홈 화면의 StudyCrew 아이콘을 눌러 주세요.");
    else if (outcome === "dismissed")
      setMessage("괜찮아요. 나중에 ‘앱 설치 안내’에서 다시 시작할 수 있어요.");
    else {
      setMessage(
        outcome === "failed"
          ? "설치 창을 열지 못했어요. 아래 방법으로 설치해 주세요."
          : "아래 방법으로 홈 화면에 추가해 주세요.",
      );
      setHelp(true);
    }
  }
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(location.origin + "/collection");
      setMessage(
        "주소를 복사했어요. Safari 또는 Chrome 주소창에 붙여 넣어 주세요.",
      );
    } catch {
      setMessage(
        `브라우저 주소창에 ${location.origin}/collection 을 입력해 주세요.`,
      );
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="install-title"
      aria-describedby="install-description"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="설치 안내 닫기"
        onClick={close}
      >
        ×
      </button>
      <Image
        className={styles.appIcon}
        src="/brand/study-friends-v2-192.png"
        width={72}
        height={72}
        alt=""
      />
      <p className={styles.eyebrow}>내 공부 친구, 홈 화면에서도</p>
      <h2 id="install-title">
        {pwa.installed
          ? "설치가 완료됐어요!"
          : "다음엔 아이콘 한 번으로 만나요"}
      </h2>
      <p id="install-description">
        {help
          ? "아래 순서대로 따라 하면 홈 화면에 아이콘이 생겨요."
          : "내 도감과 공부 스킬북을 홈 화면에서 바로 열어요. 같은 카카오 계정으로 로그인하면 도감이 이어져요."}
      </p>
      {!help && (
        <div className={styles.benefits}>
          <span>내 공부캐 모으기</span>
          <span>공부 스킬 연습하기</span>
        </div>
      )}
      {pwa.installed ? (
        <p role="status">홈 화면의 StudyCrew 아이콘을 눌러 시작해 주세요.</p>
      ) : (
        <>
          {(!help || (pwa.canInstall && !pwa.env.kakao)) && (
            <button
              type="button"
              className={`button primary ${styles.full}`}
              disabled={pwa.installing}
              onClick={() => void install()}
            >
              {pwa.installing
                ? "설치 창 확인 중…"
                : pwa.env.ios
                  ? "홈 화면에 추가하기"
                  : pwa.env.kakao
                    ? "앱 설치 방법 보기"
                    : "앱 설치하기"}
            </button>
          )}
          {help && (
            <div className={styles.help}>
              <h3>
                {pwa.env.kakao
                  ? "카카오톡 밖에서 한 번만 열어 주세요"
                  : "이 순서대로 따라 해 보세요"}
              </h3>
              {pwa.env.kakao && (
                <p>
                  카카오톡 메뉴에서 ‘다른 브라우저로 열기’를 선택해 주세요.
                  메뉴가 없으면 아래 주소를 복사해 열 수 있어요.
                </p>
              )}
              <ol>
                {pwa.env.ios ? (
                  <>
                    <li>Safari에서 이 페이지를 열어요.</li>
                    <li>
                      공유 버튼을 누르고 <strong>홈 화면에 추가</strong>를
                      선택해요.
                    </li>
                    <li>
                      ‘웹 앱으로 열기’가 보이면 켜고 <strong>추가</strong>를
                      눌러요.
                    </li>
                  </>
                ) : (
                  <>
                    <li>Chrome 또는 Edge에서 이 페이지를 열어요.</li>
                    <li>
                      주소창의 설치 아이콘 또는 브라우저 메뉴에서{" "}
                      <strong>앱 설치 / 홈 화면에 추가</strong>를 찾아요.
                    </li>
                    <li>
                      <strong>설치</strong>를 누르고 StudyCrew 아이콘으로
                      열어요.
                    </li>
                  </>
                )}
              </ol>
              <p className={styles.note}>
                메뉴 이름은 브라우저에 따라 조금 다를 수 있어요.
              </p>
              {pwa.env.kakao && (
                <button
                  className="button secondary"
                  onClick={() => void copyAddress()}
                >
                  앱 주소 복사
                </button>
              )}
            </div>
          )}
        </>
      )}
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
      <button
        type="button"
        className={`button ghost ${styles.full}`}
        onClick={close}
      >
        {pwa.installed ? "닫기" : "나중에 할게요"}
      </button>
      <p className={styles.note}>
        도감은 계정에 보관돼요. 설치 없이도 웹에서 계속 이용할 수 있어요.
      </p>
    </dialog>
  );
}
