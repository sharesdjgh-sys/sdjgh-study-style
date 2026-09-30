import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getType, FAMILIES } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("type");
  const t = code ? getType(code) : null;
  const character = t ? CHARACTERS[t.code] : null;
  const portrait = t
    ? `data:image/png;base64,${(await readFile(join(process.cwd(), "public/characters/share", `${t.code}.png`))).toString("base64")}`
    : null;
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
        {character
          ? `공부결 · ${character.name}와 같은 공부 취향`
          : "공부결 · 나다운 공부의 시작"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: t ? 64 : 78,
          lineHeight: 1.3,
          maxWidth: t ? 680 : 1000,
        }}
      >
        {t ? t.name : "남들 말고, 나답게 공부."}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "#74766c",
          maxWidth: t ? 650 : 1000,
        }}
      >
        {t
          ? `${FAMILIES[t.modality].label} · ${t.subtitle}`
          : "16개의 질문 · 16가지 공부 스타일 · 오늘의 10분 실험"}
      </div>
      {portrait && (
        // ImageResponse renders an image buffer, not a browser next/image component.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portrait}
          alt=""
          width={310}
          height={310}
          style={{
            position: "absolute",
            right: 60,
            top: 150,
            objectFit: "contain",
          }}
        />
      )}
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
