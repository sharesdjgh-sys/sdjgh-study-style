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
console.log("공부결 이용 통계 테이블 준비 완료");
