"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { SDJ_EVENT, type SdjEnrollment } from "@/lib/sdj-event";
import styles from "./page.module.css";

export function EventEnrollment() {
  const { session } = useAuth();
  return <Enrollment key={session.accountId ?? "guest"} />;
}
function Enrollment() {
  const auth = useAuth();
  const [state, setState] = useState<
    "checking" | "ready" | "saving" | "enrolled" | "error"
  >("checking");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [callbackMessage, setCallbackMessage] = useState("");
  useEffect(() => {
    const status = new URLSearchParams(location.search).get("auth");
    const notice =
      status === "cancelled"
        ? "카카오 로그인을 취소했어요. 준비되면 다시 참여해 주세요."
        : status && status !== "success"
          ? "로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."
          : "";
    const frame = requestAnimationFrame(() => setCallbackMessage(notice));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    const abort = new AbortController();
    const params = new URLSearchParams(location.search);
    const joining =
      params.get("join") === "1" && params.get("auth") === "success";
    async function load() {
      try {
        const response = await fetch("/api/events/sdj", {
          cache: "no-store",
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
        });
        if (!response.ok) throw new Error();
        const data: SdjEnrollment = await response.json();
        if (typeof data.enrolled !== "boolean") throw new Error();
        if (joining && !data.enrolled) {
          const result = await fetch("/api/events/sdj", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: params.get("from") === "qr" ? "poster_qr" : "event_page",
            }),
            signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
          });
          if (!result.ok || (await result.json()).enrolled !== true)
            throw new Error();
        }
        if (abort.signal.aborted) return;
        setMessage("");
        setState(data.enrolled || joining ? "enrolled" : "ready");
        if (joining) {
          const url = new URL(location.href);
          url.searchParams.delete("join");
          url.searchParams.delete("auth");
          history.replaceState(
            history.state,
            "",
            url.pathname + url.search + "#participate",
          );
        }
      } catch {
        if (!abort.signal.aborted) {
          setState("error");
          setMessage("참여 내역을 확인하지 못했어요. 다시 확인해 주세요.");
        }
      }
    }
    void load();
    return () => abort.abort();
  }, [auth.status, retry]);

  async function join() {
    setCallbackMessage("");
    if (auth.status !== "authenticated") {
      const url = new URL(location.href);
      url.searchParams.set("join", "1");
      url.searchParams.delete("auth");
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + "#participate",
      );
      await auth.login();
      return;
    }
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/events/sdj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source:
            new URLSearchParams(location.search).get("from") === "qr"
              ? "poster_qr"
              : "event_page",
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 401) {
        await auth.refresh();
        throw new Error();
      }
      if (!response.ok || (await response.json()).enrolled !== true)
        throw new Error();
      setState("enrolled");
    } catch {
      setState("error");
      setMessage(
        "등록을 완료하지 못했어요. 참여 내역을 다시 확인한 뒤 시도해 주세요.",
      );
    }
  }

  const signedIn = auth.status === "authenticated";
  const enrolled = signedIn && state === "enrolled";
  const pending =
    auth.busy || (signedIn && (state === "checking" || state === "saving"));
  const error = auth.status === "error" || (signedIn && state === "error");
  return (
    <div className={styles.enrollment} aria-label="이벤트 사전 참여">
      <span className={styles.enrollmentTag}>
        {enrolled ? "참가 신청 완료" : "참가 신청 접수 중"}
      </span>
      <h3>{enrolled ? "신청이 완료됐어요." : "이벤트 참가 신청"}</h3>
      <p>
        {enrolled
          ? "서여고 이벤트 신청이 완료됐어요. 이제 내 공부캐를 찾고, 친구를 초대해 함께 카드를 모아보세요."
          : signedIn
            ? "현재 로그인한 카카오 계정으로 신청해요. 아래 신청 버튼을 눌러 주세요."
            : "아래 버튼으로 카카오 로그인하면 참가 신청이 완료돼요."}
      </p>
      {enrolled ? (
        <div className={styles.enrolledActions}>
          <div className={styles.success} role="status">
            <span aria-hidden="true">✓</span> 참가 신청 완료
          </div>
          <Link href="/quiz">내 공부캐 찾으러 가기 ↗</Link>
        </div>
      ) : (
        <button
          className={styles.kakaoButton}
          disabled={
            pending ||
            !SDJ_EVENT.registrationOpen ||
            (!error && !signedIn && !auth.session.configured)
          }
          aria-busy={pending}
          onClick={() =>
            error
              ? auth.status === "error"
                ? void auth.refresh()
                : (setState("checking"), setRetry((n) => n + 1))
              : void join()
          }
        >
          {!pending && !error && !signedIn && (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 3C6.5 3 2 6.5 2 10.8c0 2.7 1.8 5.1 4.5 6.5L5.3 21l4.3-2.5c.8.1 1.6.2 2.4.2 5.5 0 10-3.5 10-7.9S17.5 3 12 3Z"
              />
            </svg>
          )}
          {pending
            ? state === "saving"
              ? "참여를 등록하고 있어요…"
              : auth.status === "redirecting"
                ? "카카오로 이동하고 있어요…"
                : "참여 정보를 확인하고 있어요…"
            : error
              ? "참여 정보 다시 확인"
              : !SDJ_EVENT.registrationOpen
                ? "참가 신청 접수 종료"
                : !signedIn && !auth.session.configured
                  ? "로그인 연결 준비 중"
                  : signedIn
                    ? "이 계정으로 참가 신청"
                    : "카카오로 로그인하고 신청하기"}
        </button>
      )}
      <p className={styles.enrollmentMessage} role="status">
        {signedIn ? message : auth.message || callbackMessage}
      </p>
      <p className={styles.joinNote}>
        지금은 서여고 이벤트 사전 신청을 받고 있어요.
        <br />
        배지 카드 지급 일정과 매점권 당첨 조건은 추후 안내해요.
      </p>
      <Link className={styles.privacyLink} href="/privacy">
        참여 기록 및 개인정보 안내
      </Link>
    </div>
  );
}
