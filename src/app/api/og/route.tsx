import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getType, FAMILIES, QUESTIONS } from "@/lib/content";
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
        background: "#f7f8f2",
        padding: "64px 76px",
        fontFamily: "Pretendard",
        color: "#243d35",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", fontSize: 32, color: "#27785d" }}>
        {character
          ? "공부캐 · 너는 무슨 캐 나왔어?"
          : "공부캐 · 공부할 때, 또 다른 나"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: t ? 64 : 78,
          lineHeight: 1.3,
          maxWidth: t ? 680 : 1000,
        }}
      >
        {character
          ? `내 공부캐는 ${character.name}!`
          : "16명 중, 너의 공부캐는 누구?"}
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
          : `${QUESTIONS.length}개의 질문 · 16명의 귀여운 캐릭터 · 다양한 공부법`}
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
        재미로 즐기는 테스트 · 성격·능력 진단 없이 다양한 공부법을 탐색해요
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
