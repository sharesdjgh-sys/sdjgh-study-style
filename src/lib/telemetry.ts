"use client";
import { type Session } from "./storage";
export type EventName =
  | "start"
  | "question"
  | "complete"
  | "share"
  | "mission_select"
  | "mission_start"
  | "feedback";
const delivered = new Set<string>();
let queue: Promise<void> = Promise.resolve();
export function track(session: Session, name: EventName, detail = "") {
  const events: [EventName, string][] =
    name === "start"
      ? [[name, detail]]
      : session.result && name !== "complete"
        ? [
            ["start", ""],
            ["complete", ""],
            [name, detail],
          ]
        : [
            ["start", ""],
            [name, detail],
          ];
  queue = queue
    .then(async () => {
      for (const [event, value] of events) {
        const key = `${session.runId}:${event}:${value}`;
        if (event !== "feedback" && delivered.has(key)) continue;
        try {
          const response = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              runId: session.runId,
              version: session.version,
              source: session.source,
              name: event,
              detail: value,
            }),
            keepalive: true,
            signal: AbortSignal.timeout(4000),
          });
          if (response.ok) delivered.add(key);
          else break;
        } catch {
          break;
        }
      }
    })
    .catch(() => {});
}
