"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import { FAMILIES, type StudyType } from "@/lib/content";
import { Icon } from "./icon";

export function CharacterCard({
  type,
  title,
  detailLink = false,
  priority = false,
}: {
  type: StudyType;
  title?: string;
  detailLink?: boolean;
  priority?: boolean;
}) {
  const character = CHARACTERS[type.code];
  const [flipped, setFlipped] = useState(false);
  const previousFlipped = useRef(false);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (previousFlipped.current === flipped) return;
    previousFlipped.current = flipped;
    (flipped ? backButton : frontButton).current?.focus({
      preventScroll: true,
    });
  }, [flipped]);
  return (
    <article
      className={`character-card ${flipped ? "is-flipped" : ""}`}
      data-family={type.modality}
      aria-label={`${character.name} · ${type.name}`}
    >
      <div className="character-card-inner">
        <div
          className="character-face character-front"
          id={`${id}-front`}
          aria-hidden={flipped}
          inert={flipped}
        >
          <div className="character-card-top">
            <span>공부캐 도감</span>
            <span className="character-edition">{character.number} / 16</span>
          </div>
          <div className="character-portrait">
            <span className="character-halo" aria-hidden="true" />
            <span className="character-spark spark-left" aria-hidden="true">
              ✳
            </span>
            <span className="character-spark spark-right" aria-hidden="true">
              ✦
            </span>
            <Image
              src={type.asset!}
              alt={`${character.name}, ${character.species} 공부 캐릭터`}
              width={768}
              height={768}
              sizes="(max-width: 767px) 90vw, (max-width: 1100px) 45vw, 400px"
              preload={priority}
            />
          </div>
          <div className="character-front-copy">
            <span className="character-family">
              {FAMILIES[type.modality].label} · {character.species}
            </span>
            <h2 className="character-name">{character.name}</h2>
            <p className="character-type-title">{title ?? type.name}</p>
            <p className="character-line">{character.line}</p>
          </div>
          <button
            ref={frontButton}
            className="character-front-trigger"
            aria-label={`${character.name} 카드 뒤집어 소개 보기`}
            aria-controls={`${id}-back`}
            onClick={() => setFlipped(true)}
          >
            <span>
              뒤집어 나를 알아봐요 <Icon name="restart-linear" size={18} />
            </span>
          </button>
        </div>
        <div
          className="character-face character-back"
          id={`${id}-back`}
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <div className="character-card-top">
            <span>이 캐릭터의 공부 이야기</span>
            <span className="character-edition">{character.number} / 16</span>
          </div>
          <span className="character-back-symbol" aria-hidden="true">
            {FAMILIES[type.modality].symbol}
          </span>
          <p className="character-back-hello">
            안녕, 나는 <strong>{character.name}!</strong>
          </p>
          <p className="character-intro">{character.intro}</p>
          <div className="character-tags">
            {character.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <dl className="character-guide">
            <div>
              <dt>내 공부 취향</dt>
              <dd>{character.habit}</dd>
            </div>
            <div>
              <dt>오늘 나랑 해볼 일</dt>
              <dd>{character.action}</dd>
            </div>
          </dl>
          <div className="character-back-actions">
            <button
              ref={backButton}
              onClick={() => setFlipped(false)}
              aria-label={`${character.name} 캐릭터 앞면 보기`}
            >
              <Icon name="restart-linear" size={18} /> 앞면 보기
            </button>
            {detailLink && (
              <Link href={`/types/${type.code}`}>
                더 알아보기 <Icon name="arrow-right-linear" size={17} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
