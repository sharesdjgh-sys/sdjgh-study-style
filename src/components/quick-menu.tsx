"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { useSavedSession } from "./use-saved-session";

/** 모바일 하단 퀵메뉴. 검사 중에는 문항에 집중하도록 숨겨요. */
export function QuickMenu() {
  const path = usePathname();
  const { session } = useSavedSession();
  if (path.startsWith("/quiz")) return null;
  const mine = session?.result
    ? { href: "/result", label: "내 결과" }
    : { href: "/quiz", label: "내 캐 찾기" };
  const items = [
    { href: "/", label: "홈", icon: "home-smile-linear", active: path === "/" },
    {
      href: "/types",
      label: "공부캐 도감",
      icon: "users-group-rounded-linear",
      active: path.startsWith("/types") || path.startsWith("/collection"),
    },
    {
      href: "/methods",
      label: "공부법 도감",
      icon: "book-bookmark-linear",
      active: path.startsWith("/methods"),
    },
    {
      ...mine,
      icon: "user-rounded-linear",
      active: path.startsWith("/result"),
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
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
