import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getType, MODALITIES, SITUATIONS, type Modality } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { resultCardRows } from "@/lib/result-card";
import { resultCardTemplate } from "@/lib/result-card-templates";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = getType(params.get("type") ?? "");
  const raw = params.get("counts") ?? "";
  const counts = raw.split(",").map(Number);
  if (
    !type ||
    !/^\d{1,2},\d{1,2},\d{1,2},\d{1,2}$/.test(raw) ||
    counts.some((count) => count > SITUATIONS.length) ||
    counts.reduce((sum, count) => sum + count, 0) !== SITUATIONS.length ||
    (params.has("download") && params.get("download") !== "1")
  ) {
    return Response.json({ error: "invalid_card" }, { status: 400 });
  }
  try {
    const png = await renderCard(type.code, counts);
    const filename = `StudyCrew-${CHARACTERS[type.code].name}-내공부캐.png`;
    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.byteLength),
        "Content-Disposition": `${params.has("download") ? "attachment" : "inline"}; filename="StudyCrew-${type.code}.png"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "card_render_failed" }, { status: 503 });
  }
}

async function renderCard(code: string, counts: number[]) {
  const template = resultCardTemplate(code);
  const [plate, font] = await Promise.all([
    sharp(join(process.cwd(), "public", template.src))
      .png()
      .toBuffer(),
    readFile(join(process.cwd(), "public/fonts/Pretendard-Medium.woff")),
  ]);
  const { rows } = resultCardRows(
    Object.fromEntries(
      MODALITIES.map((key, index) => [key, counts[index]]),
    ) as Record<Modality, number>,
  );
  const scaleX = 1080 / 941;
  const scaleY = 1920 / 1672;
  const centers = [1289, 1332, 1376, 1421];
  const palette = [
    ["#537647", "#7b9b6d"],
    ["#d8907d", "#e8b6a4"],
    ["#9b7ab6", "#baa0cf"],
    ["#d6a548", "#ebc576"],
  ];
  const rendered = new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: 1080,
        height: 1920,
        fontFamily: "Pretendard",
        fontWeight: 500,
      }}
    >
      {/* The artwork is local, validated, and embedded for server rendering. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={`data:image/png;base64,${plate.toString("base64")}`}
        width={1080}
        height={1920}
      />
      {rows.map((row, index) => (
        <div
          key={row.key}
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            top: centers[index] * scaleY,
            width: 1080,
            height: 1,
          }}
        >
          {row.fraction > 0 && (
            <div
              style={{
                position: "absolute",
                left: 249 * scaleX,
                top: -10 * scaleY,
                width: 529 * row.fraction * scaleX,
                height: 21 * scaleY,
                borderRadius: 10.5 * scaleY,
                background: `linear-gradient(${palette[index][1]}, ${palette[index][0]})`,
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: 1080 - 864 * scaleX,
              top: -25 * scaleY,
              height: 42 * scaleY,
              alignItems: "center",
              fontSize: 31 * scaleY,
              color: template.ink,
            }}
          >
            {row.percent}%
          </div>
        </div>
      ))}
    </div>,
    {
      width: 1080,
      height: 1920,
      fonts: [{ name: "Pretendard", data: font, weight: 500, style: "normal" }],
    },
  );
  // Materialize before responding so a render failure cannot become a broken PNG download.
  return rendered.arrayBuffer();
}
