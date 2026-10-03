"use client";
import Link from "next/link";
import { useState } from "react";
import { FAMILIES, MODALITIES, type Task } from "@/lib/content";
import { FAMILY_METHODS, TASKS, getMethod } from "@/lib/methods";
import { Icon } from "./icon";
import { TASK_KEYS, TaskTabs } from "./task-tabs";
import { MethodMeta } from "./method-meta";
export function MethodPreview() {
  const [task, setTask] = useState<Task>(TASK_KEYS[0]);
  return (
    <section
      className="discover-section"
      aria-labelledby="method-preview-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">내 공부캐와 상관없이</span>
          <h2 id="method-preview-title">
            같은 공부도,
            <br />
            방법은 네 가지예요.
          </h2>
        </div>
        <p>
          오늘 할 공부를 고르면 방식마다 10분 안에 해 볼 이름 있는 공부법을 보여
          줘요.
          <br className="desktop-only" />
          익숙한 공부법도, 처음 보는 공부법도 좋아요.
        </p>
      </div>
      <div className="method-preview-bar">
        <TaskTabs value={task} onChange={setTask} label="오늘 할 공부 고르기" />
        <p>{TASKS[task].when}</p>
      </div>
      <div className="method-preview-grid">
        {MODALITIES.map((m) => {
          const method = getMethod(FAMILY_METHODS[m][task]);
          return (
            <Link
              className="method-preview-card"
              data-family={m}
              href={`/methods/${m}?task=${task}`}
              key={m}
            >
              <span className="method-preview-family">
                <Icon name={FAMILIES[m].icon} size={18} />
                {FAMILIES[m].verb} · {FAMILIES[m].label}
              </span>
              <h3>{method.name}</h3>
              <p>{method.oneLine}</p>
              <MethodMeta method={method} />
              <span className="method-preview-go">
                <Icon name="clock-circle-linear" size={16} />
                10분 해보기
                <Icon name="arrow-right-linear" size={18} />
              </span>
            </Link>
          );
        })}
      </div>
      <Link className="text-link more-methods" href="/methods">
        더 많은 공부법 알아보기
        <Icon name="arrow-right-linear" size={18} />
      </Link>
    </section>
  );
}
