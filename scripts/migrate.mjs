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
const homeRewards = await readFile(
  new URL("../db/007_home_screen_rewards.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  homeRewards
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log("홈 화면 바로가기 1개·앱 설치 합산 3개 보상 준비 완료");
const goods = await readFile(
  new URL("../db/008_goods_stars.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  goods
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log("별 보상·굿즈 128종 교환 및 기존 완료 보상 준비 완료");
const cardStars = await readFile(
  new URL("../db/009_card_stars.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  cardStars
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log("카드 개봉 시 별 1~2개 최초 1회 보상 준비 완료");
const motionGoods = await readFile(
  new URL("../db/010_motion_goods.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  motionGoods
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log("스페셜 모션 카드 16종·별 3개 교환 준비 완료");

const adminIndexes = await readFile(
  new URL("../db/011_admin_indexes.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  adminIndexes
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log("관리자 통계 조회 인덱스 준비 완료");

await sql.query(
  await readFile(
    new URL("../db/012_analytics_history.sql", import.meta.url),
    "utf8",
  ),
);
console.log("분석용 일별 집계 장기 보관 정책 적용 완료");

const schoolEvent = await readFile(
  new URL("../db/013_school_event.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  schoolEvent
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
console.log("서여고 이벤트 계정별 참여 기록 준비 완료");
const wearables = await readFile(
  new URL("../db/015_wearable_goods.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  wearables
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => sql.query(s.trim())),
);
const installOnboarding = await readFile(
  new URL("../db/014_install_onboarding.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  installOnboarding
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement)),
);
console.log("최초 로그인 세션의 앱 설치 안내 1회 정책 준비 완료");
await sql.query(
  await readFile(
    new URL("../db/016_separate_wearables.sql", import.meta.url),
    "utf8",
  ),
);
const secondAccessories = await readFile(
  new URL("../db/017_second_accessories.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  secondAccessories
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => sql.query(statement.trim())),
);
