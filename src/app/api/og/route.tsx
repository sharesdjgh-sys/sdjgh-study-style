import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT } from "@/lib/share-image";
import { GeneralShareCard } from "./general-card";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("type");
  const type = code ? getType(code) : null;
  const character = type ? CHARACTERS[type.code] : null;
  const portraitBuffer = type
    ? await readFile(
        join(process.cwd(), "public/characters/share", `${type.code}.png`),
      )
    : await readFile(
        join(process.cwd(), "public/characters/teacher-tori-share.png"),
      );
  const portrait = `data:image/png;base64,${portraitBuffer.toString("base64")}`;
  const font = await readFile(
    join(process.cwd(), "public/fonts/Pretendard-Bold.woff"),
  );

  return new ImageResponse(
    !character ? (
      <GeneralShareCard portrait={portrait} />
    ) : (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f7f3e8",
          color: "#203f35",
          fontFamily: "Pretendard",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 650,
            height: 650,
            borderRadius: "50%",
            background: "#e3ebd7",
            right: -110,
            top: 100,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 64,
            top: 46,
            right: 64,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: "#36725a" }}>
            공부캐 · 공부할 때, 또 다른 나
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 62,
              fontSize: character ? 82 : 76,
              lineHeight: 1.18,
              letterSpacing: -3,
            }}
          >
            <span>{character ? "내 공부캐는" : "너의 공부캐는"}</span>
            <span style={{ color: "#33775a", fontSize: 112 }}>
              {character ? `${character.name}!` : "누구일까?"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 30,
              color: "#627368",
            }}
          >
            {character
              ? "너는 어떤 친구를 만나게 될까?"
              : "토리 선생님과 비밀의 친구 찾기"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 650,
            right: 40,
            bottom: 60,
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          {/* ImageResponse embeds the local PNG in the generated image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portrait}
            alt=""
            width={490}
            height={490}
            style={{ objectFit: "contain" }}
          />
        </div>
        {
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 64,
              bottom: 52,
              fontSize: 28,
              background: "#203f35",
              color: "#ffffff",
              padding: "16px 28px",
              borderRadius: 40,
            }}
          >
            {character ? "나도 공부캐 만나보기 →" : "어떤 친구가 기다릴까? →"}
          </div>
        }
      </div>
    ),
    {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      fonts: [{ name: "Pretendard", data: font, weight: 700, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
