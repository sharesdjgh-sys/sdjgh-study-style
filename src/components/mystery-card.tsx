import Image from "next/image";
import { STUDY_TYPES, type StudyType } from "@/lib/content";

/** Unmet characters render no names, species or reverse-side introductions. */
export function MysteryCard({
  type,
  priority = false,
}: {
  type: StudyType;
  priority?: boolean;
}) {
  const number = String(
    STUDY_TYPES.findIndex((item) => item.code === type.code) + 1,
  ).padStart(2, "0");
  return (
    <article className="mystery-card" aria-label={`미공개 캐릭터 ${number}`}>
      <div className="mystery-card-top">
        <span>아직은 비밀</span>
        <span className="character-edition">{number} / 16</span>
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
        <h2>???</h2>
        <p>어떤 공부 친구가 숨어 있을까?</p>
        <span>이름도, 취향도 아직은 비밀이에요.</span>
      </div>
      <div className="mystery-card-bottom">
        나와 닮은 한 친구만 모습을 드러내요
      </div>
    </article>
  );
}
