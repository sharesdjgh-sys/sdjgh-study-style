"use client";
import Link from "next/link";
import type { StudyType } from "@/lib/content";
import { MysteryCard } from "./mystery-card";
import { TypeResult } from "./result";
import { useSavedSession } from "./use-saved-session";
import { useCollection } from "./collection-provider";

export function TypeAccess({ type }: { type: StudyType }) {
  const { session, first, loaded } = useSavedSession();
  const { data, loaded: accountLoaded } = useCollection();
  if (!loaded || !accountLoaded)
    return (
      <main id="main" className="empty-state" role="status">
        내 캐릭터를 확인하고 있어요.
      </main>
    );
  const canView = data.signedIn
    ? data.cards.some((card) => card.code === type.code)
    : first?.result === type.code;
  if (canView) return <TypeResult type={type} />;
  return (
    <main id="main" className="secret-character-page">
      <div className="secret-character-copy">
        <span className="eyebrow">아직 만나지 않은 친구</span>
        <h1>
          이 친구의 정체는
          <br />
          <span className="accent-text">아직 비밀이에요.</span>
        </h1>
        <p>
          검사를 마치면 나와 닮은 한 친구만 모습을 드러내요.
          <br />
          도감을 저장하고 친구를 초대하면 새로운 캐릭터도 만날 수 있어요.
        </p>
        <Link
          className="button primary"
          href={session?.result ? "/result" : "/quiz"}
        >
          {session?.result ? "내 캐릭터 보러 가기" : "내 캐릭터 만나기"} →
        </Link>
        <Link className="text-link" href="/types">
          실루엣 도감으로 돌아가기
        </Link>
      </div>
      <MysteryCard type={type} priority />
    </main>
  );
}
