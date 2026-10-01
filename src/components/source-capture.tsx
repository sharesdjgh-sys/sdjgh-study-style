"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function SourceCapture() {
  const path = usePathname();
  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("from");
    const ref = new URLSearchParams(window.location.search)
      .get("ref")
      ?.toUpperCase();
    if (ref && /^[A-F0-9]{10}$/.test(ref)) {
      void fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ref }),
      })
        .then((response) => {
          if (response.ok) window.dispatchEvent(new Event("study:invite"));
        })
        .catch(() => {});
    }
    if (source && ["qr", "school", "share"].includes(source)) {
      try {
        sessionStorage.setItem("study-style:source", source);
      } catch {
        /* 저장 없이 계속 사용 */
      }
    }
  }, [path]);
  return null;
}
