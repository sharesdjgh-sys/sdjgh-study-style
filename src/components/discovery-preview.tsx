"use client";

import { useState } from "react";
import { STUDY_TYPES } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { TypeDiscovery } from "./type-discovery";
import { CharacterCard } from "./character-card";

export function DiscoveryPreview() {
  const [code, setCode] = useState(STUDY_TYPES[0].code);
  const [stage, setStage] = useState<"ready" | "playing" | "done">("ready");
  const [run, setRun] = useState(0);
  const type = STUDY_TYPES.find((candidate) => candidate.code === code)!;

  function play() {
    setRun((value) => value + 1);
    setStage("playing");
  }

  return (
    <>
      <section
        className="discovery-preview-controls"
        aria-label="미리보기 설정"
      >
        <div>
          <strong>캐릭터 등장 미리보기</strong>
          <p className="small muted">
            실제 검사와 같은 등장 연출이에요. 검사 기록과 도감은 저장하지
            않아요.
          </p>
        </div>
        <label htmlFor="preview-character">만나볼 캐릭터</label>
        <select
          id="preview-character"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setStage("ready");
          }}
        >
          {STUDY_TYPES.map((candidate) => (
            <option key={candidate.code} value={candidate.code}>
              {CHARACTERS[candidate.code].number}.{" "}
              {CHARACTERS[candidate.code].name} · {candidate.name}
            </option>
          ))}
        </select>
        <button className="button primary" onClick={play}>
          {stage === "ready" ? "등장 연출 보기" : "처음부터 다시 보기"}
        </button>
      </section>
      {stage === "playing" ? (
        <TypeDiscovery
          key={run}
          type={type}
          onComplete={() => setStage("done")}
        />
      ) : stage === "done" ? (
        <main id="main" className="result-shell">
          <section className="result-hero">
            <div className="result-copy">
              <span className="eyebrow">
                발견 완료! 이번에 만난 나의 공부 스타일
              </span>
              <h1>{type.name}</h1>
              <p className="result-character-intro">
                나를 닮은 공부캐는 <strong>{CHARACTERS[type.code].name}</strong>
              </p>
              <p className="result-subtitle">{type.subtitle}</p>
              <p>
                움직이는 카드를 감상하고, 뒤집어서 캐릭터의 소개도 확인해
                보세요.
              </p>
              <p className="small muted">
                재미로 다양한 공부 스타일과 공부법을 알아보는 테스트예요.
              </p>
            </div>
            <div className="result-character">
              <CharacterCard key={code} type={type} priority />
            </div>
          </section>
        </main>
      ) : (
        <main id="main" className="empty-state">
          <span className="eyebrow">설문 없이 바로 체험해요</span>
          <h1>내 공부캐를 만나는 순간</h1>
          <p>
            캐릭터를 고르고 ‘등장 연출 보기’를 누르면
            <br />
            실루엣이 빠르게 섞이다가, 짠! 내 캐릭터가 나타나요.
          </p>
        </main>
      )}
    </>
  );
}
