"use client";

import { usePathname } from "next/navigation";
import { useSavedSession } from "./use-saved-session";
import { useAccountResults } from "./account-results-provider";
import { useAuth } from "./auth-provider";

/** 상단 메뉴와 모바일 퀵메뉴가 같은 목적지·아이콘·선택 상태를 사용해요. */
export function useNavigationItems() {
  const path = usePathname();
  const { session, first } = useSavedSession(path);
  const { results } = useAccountResults();
  const auth = useAuth();
  const hasResult =
    session?.result || first?.result || results.length || auth.session.signedIn;

  return {
    path,
    items: [
      { href: "/", label: "홈", icon: "nav-home", active: path === "/" },
      {
        href: "/types",
        label: "공부캐 도감",
        icon: "nav-collection",
        active:
          path.startsWith("/types") ||
          path.startsWith("/collection") ||
          path.startsWith("/goods"),
      },
      {
        href: "/methods",
        label: "공부 스킬북",
        icon: "nav-skills",
        active: path.startsWith("/methods"),
      },
      {
        href: hasResult ? "/result" : "/quiz",
        label: hasResult ? "내 결과" : "내 캐 찾기",
        icon: "nav-character",
        active: path.startsWith("/result") || path.startsWith("/quiz"),
      },
      {
        href: "/account",
        label: "내 정보",
        icon: "nav-account",
        active: path === "/account",
      },
    ],
  };
}
