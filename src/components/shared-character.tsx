"use client";
import Link from "next/link";
import { CHARACTERS } from "@/lib/characters";
import { FAMILIES, type StudyType } from "@/lib/content";
import { CharacterCard } from "./character-card";
import { Share } from "./share";
import { useSavedSession } from "./use-saved-session";

export function SharedCharacter({
  type,
  referralCode,
}: {
  type: StudyType;
  referralCode?: string;
}) {
  const { session } = useSavedSession();
  const character = CHARACTERS[type.code];
  const quizHref = referralCode
    ? `/quiz?from=share&ref=${referralCode}`
    : "/quiz?from=share";
  return (
    <main id="main" className="secret-character-page shared-character-page">
      <div className="secret-character-copy">
        <span className="eyebrow">친구가 보내온 한 장의 카드</span>
        <h1>
          내 친구는 <span className="accent-text">{character.name}!</span>
          <br />넌 어떤 캐릭터 나왔어?
        </h1>
        <p className="shared-type-name">{type.name}</p>
        <p>
          {FAMILIES[type.modality].summary}
          <br />
          카드를 뒤집으면 이 친구의 이야기를 읽을 수 있어요.
        </p>
        <p className="small muted">
          친구가 공유한 캐릭터예요. 내 검사 결과는 아니에요.
        </p>
        <Link
          className="button primary"
          href={session?.result ? "/collection" : quizHref}
        >
          {session?.result ? "내 캐릭터도 보여주기" : "나도 내 캐릭터 만나기"} →
        </Link>
        <Link className="text-link" href="/types">
          다른 친구들의 실루엣 보기
        </Link>
      </div>
      <CharacterCard type={type} priority />
      <div className="shared-invitation">
        <p>우리 반에는 어떤 공부 친구들이 있을까?</p>
        <Share />
      </div>
    </main>
  );
}
