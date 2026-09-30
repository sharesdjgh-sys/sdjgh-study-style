"use client";
import Link from "next/link";
import type { StudyType } from "@/lib/content";
import { MysteryCard } from "./mystery-card";
import { TypeResult } from "./result";
import { useSavedSession } from "./use-saved-session";

export function TypeAccess({ type }: { type: StudyType }) {
  const { session, loaded } = useSavedSession();
  if (!loaded)
    return (
      <main id="main" className="empty-state" role="status">
        내 캐릭터를 확인하고 있어요.
      </main>
    );
  if (session?.result === type.code)
    return <TypeResult type={type} session={session} />;
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
          다른 친구는 어떤 캐릭터를 만났을지 물어보세요.
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
