"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCollection } from "./collection-provider";
import styles from "./header-account.module.css";

export function HeaderAccount() {
  const { data, loaded, error, refresh } = useCollection();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const label = data.signedIn ? "로그아웃" : "카카오 로그인";
  const content = (
    <Image
      className={styles.wordmark}
      src={`/brand/${data.signedIn ? "logout" : "login"}-wordmark-v1.webp`}
      alt={data.signedIn ? "Logout" : "Login"}
      width={100}
      height={38}
      unoptimized
    />
  );

  async function logout() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout_failed");
      await refresh();
    } catch {
      setNotice("로그아웃하지 못했어요. 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.container}>
      {data.signedIn ? (
        <button
          className={styles.account}
          type="button"
          aria-label={label}
          title={label}
          disabled={busy}
          aria-busy={busy}
          onClick={() => void logout()}
        >
          {content}
        </button>
      ) : loaded && !error && data.configured ? (
        <form action="/api/auth/kakao/start" method="post">
          <button
            className={styles.account}
            type="submit"
            aria-label={label}
            title={label}
          >
            {content}
          </button>
        </form>
      ) : (
        <Link
          className={styles.account}
          href="/collection"
          aria-label={label}
          title={label}
        >
          {content}
        </Link>
      )}
      {notice && (
        <span className={styles.notice} role="alert">
          {notice}
        </span>
      )}
    </div>
  );
}
