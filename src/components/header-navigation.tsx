"use client";

import Image from "next/image";
import Link from "next/link";
import { useNavigationItems } from "./use-navigation-items";

export function HeaderNavigation() {
  const { items } = useNavigationItems();
  return (
    <nav className="primary-navigation" aria-label="주요 메뉴">
      {items
        .filter((item) => item.href !== "/")
        .map((item) => (
          <Link
            key={item.icon}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
          >
            <Image
              src={`/ui-icons/${item.icon}.webp`}
              alt=""
              width={34}
              height={34}
            />
            <span>{item.label}</span>
          </Link>
        ))}
    </nav>
  );
}
