"use client";
import Link from "next/link";
import Image from "next/image";
import { MethodQuickMenu } from "./method-quick-menu";
import { useNavigationItems } from "./use-navigation-items";

/** 모바일 하단 퀵메뉴. 검사 중에는 문항에 집중하도록 숨겨요. */
export function QuickMenu() {
  const { path, items } = useNavigationItems();
  if (path.startsWith("/quiz")) return null;
  if (path === "/methods") return <MethodQuickMenu />;
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
