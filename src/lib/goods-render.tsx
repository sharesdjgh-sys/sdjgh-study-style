import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { GoodsCard } from "./goods";
export async function renderGoods(card: GoodsCard, back: boolean) {
  const special = card.kind === "special";
  const [font, art] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Pretendard-Medium.woff")),
    back
      ? sharp(
          join(
            process.cwd(),
            `public/characters/thumbs/${card.code}${card.code === "auditory-solo-flexible" ? "-v2" : ""}.png`,
          ),
        )
          .png()
          .toBuffer()
      : sharp(join(process.cwd(), `art/goods/${card.id}.webp`))
          .png()
          .toBuffer(),
  ]);
  const rendered = new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1024,
        height: 1536,
        padding: special ? 20 : 32,
        background: special ? "#c5a366" : "#fffdf6",
        fontFamily: "Pretendard",
        fontWeight: 500,
        color: special ? "#f7e2ad" : "#354e40",
      }}
    >
      {back ? (
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 70,
            background: special ? "#203149" : "#f3eddf",
            textAlign: "center",
            gap: 36,
          }}
        >
          <div style={{ fontSize: 28, color: special ? "#d7bf8c" : "#8b7650" }}>
            {`${card.back.edition} · ${card.name}`}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${art.toString("base64")}`}
            alt=""
            width={170}
            height={170}
            style={{ objectFit: "contain" }}
          />
          <div style={{ fontSize: 48, lineHeight: 1.4 }}>{card.title}</div>
          <div
            style={{
              fontSize: 37,
              lineHeight: 1.85,
              color: special ? "#e2decf" : "#596451",
            }}
          >
            {card.back.story}
          </div>
          <div
            style={{
              fontSize: 40,
              lineHeight: 1.7,
              borderTop: "2px solid #b4a380",
              paddingTop: 32,
              color: special ? "#ffe5a8" : "#765887",
            }}
          >
            {`“${card.back.quote}”`}
          </div>
          <div style={{ fontSize: 28 }}>{`— ${card.name}의 한마디`}</div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flex: 1,
            position: "relative",
            flexDirection: "column",
            background: special ? "#172439" : "#fffdf6",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${art.toString("base64")}`}
            alt=""
            width={special ? 984 : 960}
            height={special ? 1496 : 1310}
            style={{ objectFit: "cover" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: special ? "absolute" : "relative",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: special ? "100px 30px 45px" : "34px 12px",
              background: special
                ? "linear-gradient(transparent,#172439)"
                : "#fffdf6",
              gap: 14,
              alignItems: special ? "center" : "flex-start",
            }}
          >
            <div style={{ fontSize: 42 }}>{card.title}</div>
            <div
              style={{ fontSize: 24, color: special ? "#d7bf8c" : "#9a815a" }}
            >
              {`StudyCrew · ${card.name} · ${card.theme.toUpperCase()}`}
            </div>
          </div>
        </div>
      )}
    </div>,
    {
      width: 1024,
      height: 1536,
      fonts: [{ name: "Pretendard", data: font, weight: 500, style: "normal" }],
    },
  );
  return new Uint8Array(
    await sharp(Buffer.from(await rendered.arrayBuffer()))
      .jpeg({ quality: 94 })
      .toBuffer(),
  );
}
