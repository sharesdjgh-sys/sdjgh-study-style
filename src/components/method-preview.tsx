"use client";
import Link from "next/link";
import { useState } from "react";
import { FAMILIES, MODALITIES, type Task } from "@/lib/content";
import { FAMILY_METHODS, TASKS, getMethod } from "@/lib/methods";
import { Icon } from "./icon";
import { TASK_KEYS, TaskTabs } from "./task-tabs";
import { MethodMeta } from "./method-meta";
import { MethodIcon } from "./method-icon";
import { useSkills } from "./skill-provider";
export function MethodPreview() {
  const skills = useSkills();
  const [task, setTask] = useState<Task>(TASK_KEYS[0]);
  return (
    <section
      className="discover-section"
      aria-labelledby="method-preview-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">어떤 공부캐든, 스킬은 자유롭게</span>
          <h2 id="method-preview-title">
            같은 공부도,
            <br />
            스킬은 <span className="skill-spectrum">네 가지</span>예요.
          </h2>
        </div>
        <p>
          오늘 할 공부를 고르고, 마음에 드는 공부 스킬을 만나 보세요.
          <br className="desktop-only" />내 공부캐와 함께 새로운 스킬도 10분씩
          익혀 봐요.
        </p>
      </div>
      <div className="method-preview-bar">
        <TaskTabs value={task} onChange={setTask} label="오늘 할 공부 고르기" />
        <p>{TASKS[task].when}</p>
      </div>
      <div className="method-preview-grid">
        {MODALITIES.map((m) => {
          const methodId = FAMILY_METHODS[m][task];
          const method = getMethod(methodId);
          return (
            <Link
              className="method-preview-card home-method-card"
              data-family={m}
              href={`/methods/${m}?task=${task}`}
              key={m}
            >
              <MethodIcon
                id={methodId}
                size={88}
                sizes="(max-width: 767px) 72px, 88px"
                className="home-method-icon"
              />
              <span className="method-preview-family">
                <Icon name={FAMILIES[m].icon} size={18} />
                {FAMILIES[m].verb} · {FAMILIES[m].label}
              </span>
              <h3>{method.name}</h3>
              <p>{method.oneLine}</p>
              {skills.progress.unlocked.includes(methodId) && (
                <MethodMeta method={method} />
              )}
              <span className="method-preview-go">
                <Icon name="clock-circle-linear" size={16} />
                {skills.progress.unlocked.includes(methodId)
                  ? "10분 스킬 연습"
                  : "스킬 잠금 열기"}
                <Icon name="arrow-right-linear" size={18} />
              </span>
            </Link>
          );
        })}
      </div>
      <Link className="text-link more-methods" href="/methods">
        더 많은 공부 스킬 알아보기
        <Icon name="arrow-right-linear" size={18} />
      </Link>
    </section>
  );
}
