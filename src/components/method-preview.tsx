"use client";
import Link from "next/link";
import { useState } from "react";
import { FAMILIES, MODALITIES, type Task } from "@/lib/content";
import { METHODS, TASKS } from "@/lib/methods";
import { Icon } from "./icon";
import { TASK_KEYS, TaskTabs } from "./task-tabs";
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
          오늘 할 공부를 고르면 방식마다 10분 안에 해 볼 방법을 보여 줘요.
          <br className="desktop-only" />
          익숙한 방법도, 처음 보는 방법도 좋아요.
        </p>
      </div>
      <div className="method-preview-bar">
        <TaskTabs value={task} onChange={setTask} label="오늘 할 공부 고르기" />
        <p>{TASKS[task].when}</p>
      </div>
      <div className="method-preview-grid">
        {MODALITIES.map((m) => {
          const method = METHODS[m][task];
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
              <p>{method.steps[1]}</p>
              <ul aria-label="바탕 전략">
                {method.strategies.map((strategy) => (
                  <li key={strategy}>{strategy}</li>
                ))}
              </ul>
              <span className="method-preview-go">
                <Icon name="clock-circle-linear" size={16} />
                10분 해보기
                <Icon name="arrow-right-linear" size={18} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
