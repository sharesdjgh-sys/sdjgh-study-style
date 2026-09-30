"use client";
import Script from "next/script";
import { useState } from "react";
import type { StudyType } from "@/lib/content";
import { readSession } from "@/lib/storage";
import { track } from "@/lib/telemetry";
import { Icon } from "./icon";
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: { sendDefault: (options: object) => void };
    };
  }
}
export function Share({ type }: { type?: StudyType }) {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  const url = () =>
    `${window.location.origin}${type ? `/share/${type.code}` : "/"}?from=share`;
  function event(channel: string) {
    const s = readSession();
    if (s?.result) track(s, "share", channel);
  }
  async function copy(home = false) {
    const link = home ? `${window.location.origin}/?from=share` : url();
    event("copy");
    try {
      await navigator.clipboard.writeText(link);
      setManual("");
      setMessage("링크를 복사했어요. 친구에게 붙여넣어 보세요.");
    } catch {
      setManual(link);
      setMessage("아래 주소를 길게 누르거나 선택해서 복사해 주세요.");
    }
  }
  function kakao() {
    event("kakao");
    if (!ready || !window.Kakao) {
      setMessage("카카오톡 공유를 열 수 없어요. 링크 복사를 이용해 주세요.");
      return;
    }
    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: type
            ? `나의 공부 스타일은 ${type.name}`
            : "공부결 — 나다운 공부의 시작",
          description:
            type?.subtitle ?? "16개의 질문으로 나의 공부 취향을 발견해 보세요.",
          imageUrl: `${window.location.origin}/api/og${type ? `?type=${type.code}` : ""}`,
          link: { mobileWebUrl: url(), webUrl: url() },
        },
        buttons: [
          {
            title: "스타일 보기",
            link: { mobileWebUrl: url(), webUrl: url() },
          },
          {
            title: "나도 테스트하기",
            link: {
              mobileWebUrl: `${window.location.origin}/?from=share`,
              webUrl: `${window.location.origin}/?from=share`,
            },
          },
        ],
      });
      setMessage(
        "공유 창에서 보낼 곳을 선택해 주세요. 창이 열리지 않으면 링크를 복사하세요.",
      );
    } catch {
      setMessage("공유 창을 열지 못했어요. 링크 복사를 이용해 주세요.");
    }
  }
  return (
    <div className="share-block">
      {key && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js"
          strategy="lazyOnload"
          onReady={() => {
            try {
              if (!window.Kakao?.isInitialized()) window.Kakao?.init(key);
              setReady(true);
            } catch {
              setReady(false);
            }
          }}
          onError={() => setReady(false)}
        />
      )}
      <div className="button-row">
        <button className="button secondary" onClick={() => copy()}>
          <Icon name="copy-linear" size={18} />
          {type ? "내 스타일 링크 복사" : "테스트 링크 복사"}
        </button>
        <button className="button secondary" onClick={kakao}>
          <Icon name="chat-round-dots-linear" size={18} />
          카카오톡 공유
        </button>
        {type && (
          <button className="text-link" onClick={() => copy(true)}>
            테스트만 소개하기
          </button>
        )}
      </div>
      <p className="small muted" role="status">
        {message}
      </p>
      {manual && (
        <input
          className="copy-input"
          aria-label="복사할 주소"
          readOnly
          value={manual}
          onFocus={(e) => e.target.select()}
        />
      )}
    </div>
  );
}
