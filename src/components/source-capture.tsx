"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function SourceCapture() {
  const path = usePathname();
  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("from");
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
