"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "./collection-provider";
import { GiftBox } from "./reward-reveal";

export function GiftNotice() {
  const { data, loaded, error } = useCollection();
  const path = usePathname();
  if (
    !loaded ||
    error ||
    !data.signedIn ||
    !data.pending.length ||
    path.startsWith("/quiz") ||
    path === "/collection"
  )
    return null;
  return (
    <aside className="gift-arrival" aria-label="도착한 카드 선물">
      <GiftBox small />
      <p>
        <strong>친구가 이어준 선물 {data.pending.length}개 도착!</strong>
        <span>아직 만나지 못한 공부캐가 기다려요.</span>
      </p>
      <Link href="/collection#reward-inbox">
        선물 받으러 가기 <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
