"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSavedSession } from "./use-saved-session";
import { MethodQuickMenu } from "./method-quick-menu";

/** 모바일 하단 퀵메뉴. 검사 중에는 문항에 집중하도록 숨겨요. */
export function QuickMenu() {
  const path = usePathname();
  const { session } = useSavedSession();
  if (path.startsWith("/quiz")) return null;
  if (path === "/methods") return <MethodQuickMenu />;
  const mine = session?.result
    ? { href: "/result", label: "내 결과" }
    : { href: "/quiz", label: "내 캐 찾기" };
  const items = [
    { href: "/", label: "홈", icon: "nav-home", active: path === "/" },
    {
      href: "/types",
      label: "공부캐 도감",
      icon: "nav-collection",
      active: path.startsWith("/types") || path.startsWith("/collection"),
    },
    {
      href: "/methods",
      label: "공부 스킬북",
      icon: "nav-skills",
      active: path.startsWith("/methods"),
    },
    {
      ...mine,
      icon: "nav-character",
      active: path.startsWith("/result"),
    },
    {
      href: "/account",
      label: "내 정보",
      icon: "nav-account",
      active: path === "/account",
    },
  ];
  return (
    <nav className="quick-menu" aria-label="빠른 메뉴">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
        >
          <Image
            src={`/ui-icons/${item.icon}.webp`}
            alt=""
            width={36}
            height={36}
            className="quick-menu-icon"
          />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
