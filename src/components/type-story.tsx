"use client";
import { useState } from "react";
import {
  FAMILIES,
  SOCIAL_LABELS,
  PACE_LABELS,
  type StudyType,
  type Answers,
} from "@/lib/content";
import { getTypeStory } from "@/lib/type-stories";
import { scoreAnswers } from "@/lib/scoring";
import type { Session } from "@/lib/storage";
import { Icon } from "./icon";

export function TypeStory({
  type,
  session,
}: {
  type: StudyType;
  session?: Session;
}) {
  const story = getTypeStory(type);
  const [relatable, setRelatable] = useState<number[]>([]);
  const scores = session ? scoreAnswers(session.answers as Answers) : null;
  return (
    <div className="type-story" id="my-story">
      <section className="story-intro">
        <span className="eyebrow">이 유형의 머릿속 한마디</span>
        <h2>“{story.quote}”</h2>
        <p>{story.story}</p>
        <p className="story-rhythm">{story.rhythm}</p>
      </section>
      <section className="relatable-section">
        <div className="story-section-heading">
          <span className="eyebrow">공부하는 나의 한 장면</span>
          <h2>어, 이거 내 얘긴데?</h2>
          <p>공감되는 장면을 눌러보세요. 점수는 바뀌지 않아요.</p>
        </div>
        <div className="relatable-scenes">
          {story.scenes.map((scene, index) => (
            <button
              key={scene}
              className="scene-button"
              aria-pressed={relatable.includes(index)}
              onClick={() =>
                setRelatable((current) =>
                  current.includes(index)
                    ? current.filter((value) => value !== index)
                    : [...current, index],
                )
              }
            >
              <span className="scene-number">0{index + 1}</span>
              <span>{scene}</span>
              <span className="scene-check" aria-hidden="true">
                {relatable.includes(index) ? "✓" : "+"}
              </span>
            </button>
          ))}
        </div>
        <p className="scene-response" role="status">
          {
            [
              "딱 맞는 장면이 없어도 괜찮아요. 지금의 나와 비교해봐요.",
              "하나 발견! 나를 설명할 말이 조금 더 생겼네요.",
              "두 장면이 내 얘기! 어떤 상황에서 그랬는지 떠올려봐요.",
              "세 장면 모두 공감! 친구는 어떤 장면을 골랐을까요?",
            ][relatable.length]
          }
        </p>
      </section>
      <section className="study-playbook">
        <article className="playbook-strength">
          <Icon name={FAMILIES[type.modality].icon} size={30} />
          <span className="eyebrow">이 취향을 써먹는 법</span>
          <h2>
            잘 풀리는 순간을
            <br />
            직접 만들어봐요.
          </h2>
          <p>{story.strength}</p>
        </article>
        <article className="playbook-trap">
          <span className="eyebrow">이럴 땐 살짝 방향 전환</span>
          <h3>열심히 했는데, 왜 안 떠오르지?</h3>
          <p>{story.trap}</p>
          <div className="rescue-note">
            <strong>이렇게 바꿔보기 ↗</strong>
            <p>{story.rescue}</p>
          </div>
        </article>
      </section>
      <section className="exam-note">
        <div>
          <span className="eyebrow">시험 전날의 나에게</span>
          <h2>
            내일 시험이라면,
            <br />
            이것부터.
          </h2>
        </div>
        <div>
          <p>{story.exam}</p>
          <p>{story.rhythmTip}</p>
        </div>
      </section>
      <section className="style-reasons">
        <div className="story-section-heading">
          <span className="eyebrow">내 스타일을 만든 세 조각</span>
          <h2>
            {session
              ? "왜 이 유형이 나왔을까요?"
              : "이 유형은 이렇게 조합돼요."}
          </h2>
        </div>
        <dl>
          <div>
            <dt>
              <span>01</span> {FAMILIES[type.modality].label}
            </dt>
            <dd>
              {scores
                ? `${FAMILIES[type.modality].label} 관련 응답은 15점 중 ${scores.totals[type.modality]}점이에요. ${scores.candidates.modality.length > 1 ? "가장 높은 점수가 같아, 직접 고른 방식을 대표로 삼았어요." : "네 가지 공부 방식 중 응답 합계가 가장 높았어요."}`
                : FAMILIES[type.modality].summary}
            </dd>
          </div>
          <div>
            <dt>
              <span>02</span> {SOCIAL_LABELS[type.social]}
            </dt>
            <dd>
              {scores && scores.candidates.social.length > 1
                ? "혼자/함께의 응답이 같아 직접 선택한 취향이에요. "
                : ""}
              {story.environment}
            </dd>
          </div>
          <div>
            <dt>
              <span>03</span> {PACE_LABELS[type.pace]}
            </dt>
            <dd>
              {scores && scores.candidates.pace.length > 1
                ? "계획/유연함의 응답이 같아 직접 선택한 취향이에요. "
                : ""}
              {story.rhythmTip}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
