"use client";
import Image from "next/image";
import { useAuth } from "./auth-provider";
import styles from "./header-account.module.css";

export function HeaderAccount() {
  const auth = useAuth();
  const signedIn = auth.status === "authenticated";
  const error = auth.status === "error";
  const label =
    auth.status === "checking"
      ? "로그인 확인 중"
      : auth.status === "redirecting"
        ? "카카오로 이동 중"
        : auth.status === "signing-out"
          ? "로그아웃 중"
          : error
            ? "로그인 상태 다시 확인"
            : signedIn
              ? "로그아웃"
              : "카카오 로그인";
  return (
    <div className={styles.container}>
      <button
        className={styles.account}
        type="button"
        aria-label={label}
        title={label}
        disabled={
          auth.busy || (!error && !signedIn && !auth.session.configured)
        }
        aria-busy={auth.busy}
        onClick={() =>
          void (error
            ? auth.refresh()
            : signedIn
              ? auth.logout()
              : auth.login())
        }
      >
        {auth.busy || error ? (
          <span className={styles.progress}>
            {auth.busy && (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            {label}
          </span>
        ) : (
          <Image
            className={styles.wordmark}
            src={`/brand/${signedIn ? "logout" : "login"}-wordmark-v1.webp`}
            alt={signedIn ? "Logout" : "Login"}
            width={100}
            height={38}
            unoptimized
          />
        )}
      </button>
      {(auth.message ||
        (!auth.busy && !error && !signedIn && !auth.session.configured)) && (
        <span className={styles.notice} role="status">
          {auth.message || "카카오 로그인을 준비 중이에요."}
        </span>
      )}
    </div>
  );
}
