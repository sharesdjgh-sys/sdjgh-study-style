import { z } from "zod";
import { VERSION, QUESTIONS, MODALITIES, getType } from "./content";
import { resolveType, scoreAnswers } from "./scoring";
const KEY = "study-style:session";
export const DAY = 86_400_000;
const sessionSchema = z.object({
  version: z.literal(VERSION),
  runId: z.uuid(),
  startedAt: z.number(),
  updatedAt: z.number(),
  source: z.enum(["direct", "qr", "school", "share"]),
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
  index: z.number().int().min(0).max(15),
  choices: z.object({
    modality: z.enum(MODALITIES).optional(),
    social: z.enum(["solo", "team"]).optional(),
    pace: z.enum(["planned", "flexible"]).optional(),
  }),
  result: z.string().nullable(),
  completedAt: z.number().optional(),
  mission: z
    .object({
      modality: z.enum(MODALITIES),
      task: z.enum(["concept", "memory", "problem"]),
      started: z.boolean(),
      feedback: z.enum(["helpful", "mixed", "not-yet"]).optional(),
    })
    .optional(),
});
export type Session = z.infer<typeof sessionSchema>;
let memory: Session | null = null;
export function parseSession(raw: string, now = Date.now()): Session | null {
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const s = parsed.data;
    if (
      s.startedAt > now ||
      s.updatedAt > now ||
      now - (s.completedAt ?? s.updatedAt) > (s.result ? 7 * DAY : DAY)
    )
      return null;
    if (
      Object.keys(s.answers).some((id) => !QUESTIONS.some((q) => q.id === id))
    )
      return null;
    if (
      s.result &&
      (!s.completedAt ||
        s.completedAt > now ||
        !getType(s.result) ||
        resolveType(
          scoreAnswers(
            s.answers as Session["answers"] & Record<string, 1 | 2 | 3 | 4 | 5>,
          ),
          s.choices,
        ) !== s.result)
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      memory = parseSession(raw);
      if (!memory) localStorage.removeItem(KEY);
    }
  } catch {
    /* 메모리 상태로 계속 사용 */
  }
  if (memory && !parseSession(JSON.stringify(memory))) memory = null;
  return memory;
}
export function saveSession(s: Session): boolean {
  memory = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function clearSession() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem("study-style:source");
  } catch {
    /* 저장 차단 */
  }
}
export function newSession(): Session {
  let source = new URLSearchParams(window.location.search).get("from");
  if (!source)
    try {
      source = sessionStorage.getItem("study-style:source");
    } catch {
      /* 저장 차단 */
    }
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    startedAt: Date.now(),
    updatedAt: Date.now(),
    source:
      source === "qr" || source === "school" || source === "share"
        ? source
        : "direct",
    answers: {},
    index: 0,
    choices: {},
    result: null,
  };
}
