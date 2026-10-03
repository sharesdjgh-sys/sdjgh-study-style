import { resultCardData } from "./result-card";
import { resultCardTemplate } from "./result-card-templates";
import type { Session } from "./storage";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "카드 그림을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
        ),
      );
    image.src = src;
  });

export async function renderResultCard(session: Session): Promise<Blob> {
  const data = resultCardData(session);
  const template = resultCardTemplate(data.type.code);
  const [plate, fonts] = await Promise.all([
    loadImage(template.src),
    document.fonts.load("500 31px Pretendard", "0123456789%"),
  ]);
  if (!fonts.length)
    throw new Error("카드 글꼴을 불러오지 못했어요. 다시 시도해 주세요.");
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저에서 이미지를 만들 수 없어요.");
  ctx.drawImage(plate, 0, 0, 1080, 1920);
  // Every finished card already includes its own name, badges and signature.
  // Only these four score fills and percentages vary between students.
  ctx.save();
  ctx.scale(1080 / 941, 1920 / 1672);
  const rowCenters = [1289, 1332, 1376, 1421];
  const palette = [
    ["#537647", "#7b9b6d"],
    ["#d8907d", "#e8b6a4"],
    ["#9b7ab6", "#baa0cf"],
    ["#d6a548", "#ebc576"],
  ];
  data.rows.forEach((row, index) => {
    const y = rowCenters[index];
    if (row.fraction > 0) {
      const fill = ctx.createLinearGradient(249, y - 10, 249, y + 10);
      fill.addColorStop(0, palette[index][1]);
      fill.addColorStop(1, palette[index][0]);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(249, y - 10, 529 * row.fraction, 21, 10.5);
      ctx.fill();
    }
    ctx.font = "500 31px Pretendard";
    ctx.fillStyle = template.ink;
    ctx.textAlign = "right";
    ctx.fillText(`${row.percent}%`, 864, y + 11);
  });
  ctx.restore();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("이미지 저장에 실패했어요. 다시 시도해 주세요.")),
      "image/png",
    ),
  );
}
