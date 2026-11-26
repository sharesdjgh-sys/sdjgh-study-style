"use client";
import { requestSignal } from "@/lib/request-signal";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import styles from "./page.module.css";

export function EventEntry({ resume }: { resume: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const claim = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/events/sdj/bonus", {
        method: "POST",
        signal: requestSignal(10000),
      });
      if (!response.ok) throw new Error();
      const { status } = await response.json();
      if (status === "awaiting_result") router.push("/quiz");
      else if (
        ["granted", "already_granted", "collection_complete"].includes(status)
      )
        router.push("/collection");
      else throw new Error();
    } catch {
      setMessage("카드 혜택을 확인하지 못했어요. 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }, [router]);
  useEffect(() => {
    if (!resume || auth.status !== "authenticated") return;
    void claim();
  }, [resume, auth.status, claim]);
  return (
    <>
      <button
        className={auth.status === "authenticated" ? styles.primary : styles.kakaoButton}
        disabled={busy || auth.busy}
        onClick={() => {
          if (auth.status !== "authenticated") {
            void auth.login("/events/sdj?from=qr&bonus=1");
          } else {
            void claim();
          }
        }}
      >
        {auth.status !== "authenticated" && (
          <Image src="/kakao-symbol.svg" alt="" width={20} height={20} />
        )}
        {busy
          ? "카드 확인 중…"
          : auth.status === "authenticated"
            ? "내 공부캐 찾기"
            : "카톡으로 로그인하고 내 공부캐 찾기"}
      </button>
      <p role="status">{message || auth.message}</p>
    </>
  );
}
