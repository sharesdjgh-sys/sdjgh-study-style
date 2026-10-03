import Image from "next/image";
import { STUDY_TYPES, type StudyType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";

/** The catalog may reveal a name while keeping its silhouette and question mark. */
export function MysteryCard({
  type,
  priority = false,
  revealName = false,
}: {
  type: StudyType;
  priority?: boolean;
  revealName?: boolean;
}) {
  const number = String(
    STUDY_TYPES.findIndex((item) => item.code === type.code) + 1,
  ).padStart(2, "0");
  return (
    <article
      className="mystery-card"
      aria-label={
        revealName
          ? `${CHARACTERS[type.code].name} · 미발견 캐릭터 ${number}`
          : `미공개 캐릭터 ${number}`
      }
    >
      <div className="mystery-card-top">
        <span>아직은 비밀</span>
        <span className="character-edition">No. {number}</span>
      </div>
      <div className="mystery-portrait" aria-hidden="true">
        <span className="mystery-orbit" />
        <Image
          src={type.asset!}
          alt=""
          width={768}
          height={768}
          sizes="(max-width: 767px) 85vw, (max-width: 1100px) 45vw, 380px"
          preload={priority}
          draggable={false}
        />
        <span className="mystery-question">?</span>
      </div>
      <div className="mystery-copy">
        <h2>{revealName ? CHARACTERS[type.code].name : "???"}</h2>
        <p>어떤 귀여운 친구가 숨어 있을까?</p>
        <span>
          {revealName
            ? "어떤 모습일지, 만나면 알 수 있어요."
            : "이름도, 취향도 아직은 비밀이에요."}
        </span>
      </div>
      <div className="mystery-card-bottom">
        첫 검사와 친구 초대로 하나씩 만나요
      </div>
    </article>
  );
}
