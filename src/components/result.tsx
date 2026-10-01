"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FAMILIES,
  MODALITIES,
  SOCIAL_LABELS,
  PACE_LABELS,
  getType,
  type Answers,
  type StudyType,
} from "@/lib/content";
import { readSession, clearSession, type Session } from "@/lib/storage";
import { scoreAnswers } from "@/lib/scoring";
import { CharacterCard } from "./character-card";
import { CHARACTERS } from "@/lib/characters";
import { Share } from "./share";
import { Mission } from "./mission";
import { Icon } from "./icon";
import { useConfirm } from "./ui/confirm-dialog";
import { TypeStory } from "./type-story";
import { MysteryCard } from "./mystery-card";
import { useCollection } from "./collection-provider";
import { CollectionNudge } from "./collection-manager";
export function TypeResult({
  type,
  session,
  hideCharacter = false,
}: {
  type: StudyType;
  session?: Session;
  hideCharacter?: boolean;
}) {
  const f = FAMILIES[type.modality];
  const scores = session ? scoreAnswers(session.answers as Answers) : null;
  const chosen =
    scores && Object.values(scores.candidates).some((a) => a.length > 1);
  return (
    <main id="main" className="result-shell">
      <Link href={session ? "/" : "/types"} className="text-link small">
        <Icon name="arrow-left-linear" size={16} />
        {session ? "공부캐 홈" : "공부캐 도감"}
      </Link>
      <section className="result-hero">
        <div className="result-copy">
          <span className="eyebrow">
            {session
              ? "발견 완료! 이번에 만난 나의 공부 스타일"
              : "공부캐 도감 · 캐릭터의 공부 스타일"}
          </span>
          <h1>{type.name}</h1>
          {!hideCharacter && (
            <p className="result-character-intro">
              나를 닮은 공부캐는 <strong>{CHARACTERS[type.code].name}</strong>
            </p>
          )}
          {hideCharacter && (
            <p className="notice">
              재검사에서는 유형과 설명만 확인할 수 있어요. 첫 캐릭터와 수집한
              도감은 그대로 유지돼요.
            </p>
          )}
          <p className="result-subtitle">{type.subtitle}</p>
          <div className="tag-row">
            <span>{f.label}</span>
            <span>{SOCIAL_LABELS[type.social]}</span>
            <span>{PACE_LABELS[type.pace]}</span>
          </div>
          <nav className="result-shortcuts" aria-label="결과 자세히 보기">
            <a href="#my-story">
              공부 스타일 이야기 <span>↓</span>
            </a>
            <a href="#share-style">
              친구에게 보여주기 <span>↗</span>
            </a>
          </nav>
          <p className="result-explanation">
            {f.summary}{" "}
            {type.social === "solo"
              ? "혼자 생각할 시간을 확보하고"
              : "서로 생각을 나눌 기회를 만들고"}
            ,{" "}
            {type.pace === "planned"
              ? "순서를 정해두면 시작하기 편할 수 있어요."
              : "그때의 상황에 맞춰 순서를 조절해 보세요."}
          </p>
          {chosen && (
            <p className="notice">
              비슷한 후보 중 직접 선택한 대표 스타일이에요.
            </p>
          )}
          <aside className="test-purpose result-caveat">
            <Icon name="stars-linear" size={20} />
            <p>
              <strong>재미로 만난 캐릭터, 나의 가능성은 더 넓어요.</strong>
              <br />
              {session
                ? "다양한 공부 스타일과 공부법을 알아보는 테스트예요. 성격·능력을 진단하지 않아요."
                : "이 페이지는 캐릭터의 공부 스타일 소개예요. 개인 검사 결과는 아니에요."}{" "}
              결과와 상관없이 다른 공부법도 자유롭게 시도해 보세요.
            </p>
          </aside>
          {!session && (
            <Link href="/quiz" className="button primary">
              내 공부캐 찾기
              <Icon name="arrow-right-linear" />
            </Link>
          )}
        </div>
        <div className="result-character">
          {hideCharacter ? (
            <MysteryCard type={type} priority />
          ) : (
            <CharacterCard type={type} priority />
          )}
        </div>
      </section>
      {session && <CollectionNudge />}
      <TypeStory key={type.code} type={type} session={session} />
      {scores && (
        <section className="score-section">
          <div>
            <span className="eyebrow">내 응답 살펴보기</span>
            <h2>
              한 가지 모습만
              <br />
              있는 건 아니니까요.
            </h2>
            <p className="muted small">
              점수는 선호의 응답 합계예요.
              <br />
              능력이나 학습 효과의 확률이 아니에요.
            </p>
          </div>
          <div className="score-bars">
            {MODALITIES.map((m) => (
              <div className="score-row" key={m}>
                <span>{FAMILIES[m].label}</span>
                <div>
                  <span
                    style={{
                      transform: `scaleX(${scores.totals[m] / 15})`,
                    }}
                  />
                </div>
                <span className="mono">{scores.totals[m]} / 15</span>
              </div>
            ))}
            {scores.close.modalities.length > 1 && (
              <p className="small">
                {scores.close.modalities
                  .map((m) => FAMILIES[m].label)
                  .join(" · ")}
                을 비슷하게 선호했어요.
              </p>
            )}
            {(scores.close.social || scores.close.pace) && (
              <p className="small muted">
                {scores.close.social ? "혼자/함께" : ""}
                {scores.close.social && scores.close.pace ? ", " : ""}
                {scores.close.pace ? "계획/즉흥" : ""} 성향도 차이가 작아요.
                상황에 맞춰 바꿔보세요.
              </p>
            )}
          </div>
        </section>
      )}
      <Mission modality={type.modality} type={type} />
      <section className="next-review">
        <Icon name="calendar-linear" size={32} />
        <div>
          <h3>내일 한 번 더, 짧게 꺼내보세요.</h3>
          <p>
            오늘 공부한 내용을 보지 않고 떠올려 보세요. 어려웠던 부분을 확인하고
            다시 시도해요. 다음 날은 시작을 위한 제안이며, 과목마다 간격을
            조절해도 좋아요.
          </p>
        </div>
      </section>
      <section className="alternatives">
        <span className="eyebrow">다른 방법도 내 것이 될 수 있어요</span>
        <h2>이런 공부법도 있어요.</h2>
        <div className="method-links">
          {MODALITIES.filter((m) => m !== type.modality).map((m) => (
            <Link href={`/methods/${m}`} key={m}>
              <Icon name={FAMILIES[m].icon} />
              <span>
                <strong>{FAMILIES[m].activity}</strong>
                <small>{FAMILIES[m].detail}</small>
              </span>
              <Icon name="arrow-right-up-linear" />
            </Link>
          ))}
        </div>
      </section>
      <section className="share-section" id="share-style">
        <span className="eyebrow">친구의 공부 취향도 궁금하다면</span>
        <h2>“너 무슨 공부캐 나왔어?”</h2>
        <p>
          {hideCharacter
            ? "테스트를 소개하거나 도감에서 처음 만난 캐릭터를 공유해 보세요."
            : "내 캐릭터 한 명만 친구에게 보여줘요. 답변과 상세 점수는 링크에 담지 않아요."}
        </p>
        <Share type={hideCharacter ? undefined : type} />
      </section>
    </main>
  );
}
export function PersonalResult() {
  const { data: collection, loaded: accountLoaded } = useCollection();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirm, dialog] = useConfirm();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSession(readSession());
      setLoaded(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  if (!loaded || !accountLoaded)
    return (
      <main id="main" className="empty-state" role="status">
        내 결과를 불러오고 있어요.
      </main>
    );
  const type = session?.result ? getType(session.result) : null;
  if (!type || !session)
    return (
      <main id="main" className="empty-state">
        <span className="eyebrow">새로운 발견을 시작해요</span>
        <h1>아직 이 기기에 결과가 없어요.</h1>
        <p>
          검사를 완료하면 나만의 스타일과 공부법을 볼 수 있어요.
          <br />
          답변·점수는 이 기기에만 남아요. 저장한 도감은 로그인하면 불러올 수
          있어요.
        </p>
        <Link className="button primary" href="/quiz">
          내 스타일 찾기
          <Icon name="arrow-right-linear" />
        </Link>
        <Link className="text-link" href="/collection">
          내 도감 불러오기 →
        </Link>
      </main>
    );
  return (
    <>
      <TypeResult
        type={type}
        session={session}
        hideCharacter={Boolean(
          session.isRetake ||
          (collection.firstRunId && collection.firstRunId !== session.runId),
        )}
      />
      <div className="result-reset">
        <Link href="/quiz" className="text-link">
          다시 검사하기
          <Icon name="restart-linear" size={17} />
        </Link>
        <button
          className="text-link muted"
          onClick={async () => {
            if (
              await confirm({
                title: "이 기기의 기록을 지울까요?",
                description:
                  "이 기기의 최초·최근 검사와 활동 기록을 지워요. 계정에 저장한 도감은 유지돼요.",
                note: "삭제한 기기 기록은 복구할 수 없어요. 이미 전송된 이용 통계는 정해진 보관 기간에 따라 처리돼요.",
                confirmLabel: "기록 지우기",
                tone: "danger",
              })
            ) {
              clearSession();
              setSession(null);
            }
          }}
        >
          이 기기의 기록 지우기
        </button>
      </div>
      {dialog}
    </>
  );
}
