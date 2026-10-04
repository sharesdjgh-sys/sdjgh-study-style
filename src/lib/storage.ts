import { z } from "zod";
import {
  VERSION,
  QUESTIONS,
  MODALITIES,
  getType,
  isValidAnswer,
  type Answers,
} from "./content";
import { resolveType, scoreAnswers } from "./scoring";
import { METHOD_IDS, type MethodId } from "./methods";
const KEY = "study-style:session";
const FIRST_KEY = "study-style:first-result";
export const RECORDS_CLEARED = "study-style:records-cleared";
export function isRecordRemoval(event: StorageEvent) {
  return (
    event.newValue === null &&
    (event.key === null || event.key === KEY || event.key === FIRST_KEY)
  );
}
export const DAY = 86_400_000;
const sessionSchema = z.object({
  version: z.literal(VERSION),
  runId: z.uuid(),
  startedAt: z.number(),
  updatedAt: z.number(),
  source: z.enum(["direct", "qr", "school", "share"]),
  answers: z.record(
    z.string(),
    z.union([z.enum(MODALITIES), z.number().int().min(1).max(4)]),
  ),
  index: z
    .number()
    .int()
    .min(0)
    .max(QUESTIONS.length - 1),
  choices: z.object({
    modality: z.enum(MODALITIES).optional(),
    social: z.enum(["solo", "team"]).optional(),
    pace: z.enum(["planned", "flexible"]).optional(),
  }),
  result: z.string().nullable(),
  completedAt: z.number().optional(),
  isRetake: z.boolean().optional(),
  mission: z
    .object({
      method: z.enum(METHOD_IDS as [MethodId, ...MethodId[]]).optional(),
      // 공부법 ID가 생기기 전 기록은 방식·과제로 저장돼 있어요.
      modality: z.enum(MODALITIES).optional(),
      task: z.enum(["concept", "memory", "problem"]).optional(),
      started: z.boolean(),
      feedback: z.enum(["helpful", "mixed", "not-yet"]).optional(),
    })
    .optional(),
});
export type Session = z.infer<typeof sessionSchema>;
let memory: Session | null = null;
let firstMemory: Session | null = null;
let memoryOnly = false;
let firstMemoryOnly = false;
export function parseSession(
  raw: string,
  now = Date.now(),
  allowArchived = false,
): Session | null {
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const s = parsed.data;
    if (
      s.startedAt > now ||
      s.updatedAt > now ||
      (!allowArchived &&
        now - (s.completedAt ?? s.updatedAt) > (s.result ? 7 * DAY : DAY))
    )
      return null;
    if (
      Object.entries(s.answers).some(([id, answer]) => {
        const q = QUESTIONS.find((question) => question.id === id);
        return !q || !isValidAnswer(q, answer);
      })
    )
      return null;
    if (
      s.result &&
      (!s.completedAt ||
        s.completedAt > now ||
        !getType(s.result) ||
        resolveType(scoreAnswers(s.answers as Answers), s.choices) !== s.result)
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
    if (!raw && !memoryOnly) memory = null;
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
    memoryOnly = false;
    return true;
  } catch {
    memoryOnly = true;
    return false;
  }
}
export function readFirstSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FIRST_KEY);
    if (!raw && !firstMemoryOnly) firstMemory = null;
    if (raw) {
      firstMemory = parseSession(raw);
      if (!firstMemory?.result || firstMemory.isRetake) firstMemory = null;
      if (!firstMemory) localStorage.removeItem(FIRST_KEY);
    }
  } catch {
    /* 메모리로 계속 사용 */
  }
  if (firstMemory && !parseSession(JSON.stringify(firstMemory)))
    firstMemory = null;
  if (!firstMemory) {
    const previous = readSession();
    if (previous?.result && !previous.isRetake) rememberFirstSession(previous);
  }
  return firstMemory;
}
export function rememberFirstSession(s: Session) {
  if (!s.result || s.isRetake) return;
  try {
    const existing = localStorage.getItem(FIRST_KEY);
    if (!existing && !firstMemoryOnly) firstMemory = null;
    if (existing) {
      firstMemory = parseSession(existing);
      if (!firstMemory?.result || firstMemory.isRetake) firstMemory = null;
    }
  } catch {
    /* 메모리로 계속 사용 */
  }
  if (firstMemory) return;
  firstMemory = { ...s, mission: undefined };
  try {
    localStorage.setItem(FIRST_KEY, JSON.stringify(firstMemory));
    firstMemoryOnly = false;
  } catch {
    firstMemoryOnly = true;
    /* 메모리로 계속 사용 */
  }
}
export function clearSession() {
  memory = null;
  firstMemory = null;
  memoryOnly = false;
  firstMemoryOnly = false;
  for (const key of [KEY, FIRST_KEY]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* Attempt each key even when one storage operation fails. */
    }
  }
  try {
    sessionStorage.removeItem("study-style:source");
  } catch {
    /* 저장 차단 */
  }
  if (typeof window !== "undefined")
    window.dispatchEvent?.(new Event(RECORDS_CLEARED));
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
    isRetake: Boolean(readFirstSession()?.result || readSession()?.isRetake),
  };
}
