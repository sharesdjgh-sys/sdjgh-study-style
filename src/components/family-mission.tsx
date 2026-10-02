"use client";
import { useEffect, useState } from "react";
import type { Modality, Task } from "@/lib/content";
import { FAMILY_METHODS, missionMethod } from "@/lib/methods";
import { readSession } from "@/lib/storage";
import { Mission } from "./mission";
import { MethodOwner } from "./method-owner";
import { TASK_KEYS, TaskTabs } from "./task-tabs";

/** 한 방식의 계열 공부법 3개를 과제 탭으로 바꿔 가며 해 봐요. */
export function FamilyMission({ modality }: { modality: Modality }) {
  const [task, setTask] = useState<Task>("concept");
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      // 홈에서 과제를 골라 들어오면(?task=memory) 그 과제를 먼저 보여 줘요.
      const param = new URLSearchParams(window.location.search).get("task");
      const linked = TASK_KEYS.find((t) => t === param);
      const m = readSession()?.mission;
      const saved = m && missionMethod(m);
      const savedTask = TASK_KEYS.find(
        (t) => FAMILY_METHODS[modality][t] === saved,
      );
      const next = linked ?? savedTask;
      if (next) setTask(next);
    });
    return () => cancelAnimationFrame(id);
  }, [modality]);
  const methodId = FAMILY_METHODS[modality][task];
  return (
    <>
      <MethodOwner id={methodId} />
      <Mission
        key={methodId}
        methodId={methodId}
        tabs={
          <TaskTabs value={task} onChange={setTask} label="공부 과제 선택" />
        }
      />
    </>
  );
}
