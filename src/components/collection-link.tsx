"use client";
import Image from "next/image";
import Link from "next/link";
import { useCollection } from "./collection-provider";
import { Icon } from "./icon";

export function CollectionLink({ className = "" }: { className?: string }) {
  const { data } = useCollection();
  return (
    <Link
      href="/collection"
      className={`collection-entry-link ${data.signedIn ? "is-signed-in" : "is-kakao"} ${className}`}
    >
      {data.signedIn ? (
        <Icon name="book-bookmark-linear" size={20} />
      ) : (
        <Image
          src="/kakao-symbol.svg"
          alt=""
          width={20}
          height={20}
          unoptimized
        />
      )}
      <span>{data.signedIn ? "내 도감 보기" : "내 도감 · 카카오 로그인"}</span>
      <Icon name="arrow-right-linear" size={16} />
    </Link>
  );
}
