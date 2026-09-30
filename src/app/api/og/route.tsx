import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getType, FAMILIES } from "@/lib/content";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("type");
  const t = code ? getType(code) : null;
  const font = await readFile(
    join(process.cwd(), "public/fonts/Pretendard-Bold.woff"),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f7f6f2",
        padding: "64px 76px",
        fontFamily: "Pretendard",
        color: "#292a26",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", fontSize: 32, color: "#ce533b" }}>
        공부결 · 나다운 공부의 시작
      </div>
      <div
        style={{
          display: "flex",
          fontSize: t ? 64 : 78,
          lineHeight: 1.3,
          maxWidth: 1000,
        }}
      >
        {t ? t.name : "남들 말고, 나답게 공부."}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#74766c" }}>
        {t
          ? `${FAMILIES[t.modality].label} · ${t.subtitle}`
          : "16개의 질문 · 16가지 공부 스타일 · 오늘의 10분 실험"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 20,
          borderTop: "1px solid #dedfd4",
          paddingTop: 24,
        }}
      >
        가입 없이 내 공부 취향을 발견해 보세요.
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Pretendard", data: font, weight: 700, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
