import { z } from "zod";
import { VERSION } from "./content";
export const eventSchema = z
  .object({
    runId: z.uuid(),
    version: z.literal(VERSION),
    source: z.enum(["direct", "qr", "school", "share"]),
    name: z.enum([
      "start",
      "question",
      "complete",
      "share",
      "mission_select",
      "mission_start",
      "feedback",
    ]),
    detail: z.string().max(16),
  })
  .strict()
  .superRefine((e, ctx) => {
    const valid =
      e.name === "question"
        ? /^([1-9]|1[0-6])$/.test(e.detail)
        : e.name === "share"
          ? ["copy", "kakao"].includes(e.detail)
          : e.name === "feedback"
            ? ["helpful", "mixed", "not-yet"].includes(e.detail)
            : e.detail === "";
    if (!valid)
      ctx.addIssue({
        code: "custom",
        message: "허용되지 않은 이벤트 값",
        path: ["detail"],
      });
  });
