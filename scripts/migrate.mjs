import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL) {
  console.error(".env.local에 DATABASE_URL을 설정해 주세요.");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const source = await readFile(
  new URL("../db/001_analytics.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  source
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
await sql.query(
  await readFile(new URL("../db/002_retention.sql", import.meta.url), "utf8"),
);
const collections = await readFile(
  new URL("../db/003_collections.sql", import.meta.url),
  "utf8",
);
// Neon prepared queries accept one statement. Explicit boundaries preserve the
// semicolons inside the PL/pgSQL function while applying this migration atomically.
await sql.transaction(
  collections
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
const results = await readFile(
  new URL("../db/004_saved_results.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  results
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
console.log("StudyCrew 통계·계정·도감·검사 결과 테이블 준비 완료");
const lifecycle = await readFile(
  new URL("../db/005_account_lifecycle.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  lifecycle
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
console.log("7일 재가입 제한·최초 가입 보상 정책 준비 완료");
const skills = await readFile(
  new URL("../db/006_skill_hearts.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  skills
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log("하트·스킬 해제·10분 실천 보상 준비 완료");
