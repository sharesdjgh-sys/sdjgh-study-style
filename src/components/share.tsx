"use client";
import Script from "next/script";
import Image from "next/image";
import styles from "./share.module.css";
import { useState } from "react";
import type { StudyType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { SIGNATURE_METHODS, getMethod } from "@/lib/methods";
import { readSession } from "@/lib/storage";
import { track } from "@/lib/telemetry";
import { Icon } from "./icon";
import { useCollection } from "./collection-provider";
import {
  shareImagePath,
  SHARE_IMAGE_WIDTH,
  SHARE_IMAGE_HEIGHT,
} from "@/lib/share-image";
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
  const { data } = useCollection();
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  const url = (home = false) => {
    const params = new URLSearchParams({ from: "share" });
    if (data.inviteCode) params.set("ref", data.inviteCode);
    return `${window.location.origin}${!home && type ? `/share/${type.code}` : "/"}?${params}`;
  };
  function event(channel: string) {
    const s = readSession();
    if (s?.result) track(s, "share", channel);
  }
  async function copy(home = false) {
    const link = url(home);
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
            ? `내 공부캐는 ${CHARACTERS[type.code].name}! 너는 누구야?`
            : "StudyCrew — 나와 닮은 공부캐를 만나요",
          description: type
            ? `시그니처 공부법은 ${getMethod(SIGNATURE_METHODS[type.code]).name}! 재미로 만나는 공부 캐릭터와 다양한 공부법을 발견해요.`
            : "나와 닮은 공부캐를 만나고, 도감을 채우며 다양한 공부법과 미션을 즐겨 보세요.",
          imageUrl: `${window.location.origin}${shareImagePath(type?.code)}`,
          imageWidth: SHARE_IMAGE_WIDTH,
          imageHeight: SHARE_IMAGE_HEIGHT,
          link: { mobileWebUrl: url(), webUrl: url() },
        },
        buttons: [
          {
            title: "공부캐 보기",
            link: { mobileWebUrl: url(), webUrl: url() },
          },
          {
            title: "나도 테스트하기",
            link: {
              mobileWebUrl: url(true),
              webUrl: url(true),
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
      <div className={`button-row ${styles.actions}`}>
        <button
          className={`button secondary ${styles.copy}`}
          onClick={() => copy()}
        >
          <Icon name="copy-linear" size={18} />
          {type ? "내 공부캐 링크 복사" : "테스트 링크 복사"}
        </button>
        <button className={`button secondary ${styles.kakao}`} onClick={kakao}>
          <Image src="/kakao-symbol.svg" alt="" width={22} height={22} />
          친구에게 카카오톡 공유
        </button>
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
