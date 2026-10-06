// Animate the existing generated artwork into three reusable, silent H.264 clips.
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import sharp from "sharp";

await mkdir(".artifacts/skill-unlock", { recursive: true });
const data = async (id) =>
  `data:image/webp;base64,${(await readFile(`public/skills/${id}.webp`)).toString("base64")}`;
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.setContent('<canvas width="640" height="640"></canvas>');
  await page.evaluate(
    async (sources) => {
      const images = await Promise.all(
        sources.map(async (src) => {
          const image = new Image();
          image.src = src;
          await image.decode();
          return image;
        }),
      );
      const canvas = document.querySelector("canvas"),
        ctx = canvas.getContext("2d");
      const clamp = (n) => Math.min(1, Math.max(0, n));
      const smooth = (t, a, b) => {
        const p = clamp((t - a) / (b - a));
        return p * p * (3 - 2 * p);
      };
      const layouts = {
        1: {
          slots: [0.5],
          y: 0.66,
          size: 0.295,
          heartHeight: 0.22,
          split: 0.405,
        },
        2: {
          slots: [0.375, 0.625],
          y: 0.65,
          size: 0.225,
          heartHeight: 0.168,
          split: 0.405,
        },
        3: {
          slots: [0.25, 0.5, 0.75],
          y: 0.64,
          size: 0.195,
          heartHeight: 0.15,
          split: 0.375,
        },
      };
      // Separate the two feet from the body along the transparent gap, rather
      // than lifting a rectangular strip of the body along with the shackle.
      const parts = {};
      for (const cost of [1, 2, 3]) {
        const image = images[cost],
          split = layouts[cost].split;
        const outline = [
          [0, 0],
          [1, 0],
          [1, split - 0.07],
          [0.92, split - 0.07],
          [0.92, split],
          [0.65, split],
          [0.65, split - 0.04],
          [0.36, split - 0.04],
          [0.36, split],
          [0.07, split],
          [0.07, split - 0.07],
          [0, split - 0.07],
        ];
        parts[cost] = ["destination-out", "destination-in"].map((operation) => {
          const layer = document.createElement("canvas");
          layer.width = image.width;
          layer.height = image.height;
          const c = layer.getContext("2d");
          c.drawImage(image, 0, 0);
          c.globalCompositeOperation = operation;
          c.beginPath();
          outline.forEach(([x, y], i) =>
            i
              ? c.lineTo(x * image.width, y * image.height)
              : c.moveTo(x * image.width, y * image.height),
          );
          c.closePath();
          c.fill();
          return layer;
        });
      }
      window.renderLockFrame = ({ cost, t }) => {
        const lock = images[cost],
          heart = images[0],
          layout = layouts[cost];
        const openAt = 4.35;
        const opening = smooth(t, openAt, 5.05),
          finish = smooth(t, 5.25, 6);
        ctx.fillStyle = "#fffaf3";
        ctx.fillRect(0, 0, 640, 640);
        const glow = ctx.createRadialGradient(320, 300, 25, 320, 300, 350);
        glow.addColorStop(0, `rgba(232,211,240,${0.48 + opening * 0.22})`);
        glow.addColorStop(1, "rgba(255,250,243,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 640, 640);
        ctx.save();
        ctx.translate(320, 476);
        ctx.scale(1, 0.16);
        ctx.beginPath();
        ctx.arc(0, 0, 125, 0, Math.PI * 2);
        ctx.fillStyle = "#65487212";
        ctx.fill();
        ctx.restore();
        // Hearts are carried from a little row below the lock to its actual empty sockets.
        const h = 320,
          w = (h * lock.width) / lock.height,
          x = (640 - w) / 2,
          y = 128;
        const bounce = Math.sin(opening * Math.PI) * -8;
        ctx.save();
        ctx.translate(0, bounce);
        ctx.drawImage(parts[cost][0], x, y, w, h);
        ctx.save();
        const px = x + w * 0.78,
          py = y + h * layout.split;
        ctx.translate(px, py);
        ctx.rotate(opening * 0.23);
        ctx.drawImage(parts[cost][1], x - px, y - py, w, h);
        ctx.restore();
        for (let i = 0; i < cost; i++) {
          const start = cost === 1 ? 1.5 : cost === 2 ? 1 + i * 1.3 : 0.6 + i,
            flight = cost === 1 ? 1.7 : 0.9,
            travel = clamp((t - start) / flight),
            p = 1 - Math.pow(1 - travel, 3);
          const targetX = x + w * layout.slots[i],
            targetY = y + h * layout.y;
          const fromX = 320 + (i - (cost - 1) / 2) * 80,
            fromY = 548;
          const cx = fromX + (targetX - fromX) * p,
            cy = fromY + (targetY - fromY) * p - Math.sin(p * Math.PI) * 45;
          const targetSize = w * layout.size,
            size = 72 + (targetSize - 72) * p,
            height =
              (72 * heart.height) / heart.width +
              (h * layout.heartHeight - (72 * heart.height) / heart.width) * p;
          const impact =
            Math.sin(clamp((t - start - flight) / 0.38) * Math.PI) * 0.1;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((1 - p) * Math.sin(t * 5 + i) * 0.1);
          ctx.scale(1 + impact, 1 - impact * 0.55);
          ctx.globalAlpha = 0.75 + 0.25 * smooth(t, start - 0.1, start + 0.1);
          ctx.shadowBlur = p < 1 ? 15 : 0;
          ctx.shadowColor = "#d4709050";
          ctx.drawImage(heart, -size / 2, -height / 2, size, height);
          ctx.restore();
          const burst = clamp((t - start - flight + 0.04) / 0.65);
          if (burst > 0 && burst < 1) {
            for (let j = 0; j < 7; j++) {
              const angle = (j * Math.PI * 2) / 7;
              ctx.beginPath();
              ctx.arc(
                targetX + Math.cos(angle) * (18 + burst * 40),
                targetY + Math.sin(angle) * (18 + burst * 40),
                2.8 * (1 - burst),
                0,
                Math.PI * 2,
              );
              ctx.fillStyle = `rgba(218,167,75,${1 - burst})`;
              ctx.fill();
            }
          }
        }
        ctx.restore();
        if (opening > 0) {
          for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const r = 130 + opening * 75;
            const sx = 320 + Math.cos(angle) * r,
              sy = 300 + Math.sin(angle) * r;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(t * 0.4 + i);
            ctx.globalAlpha =
              Math.sin(opening * Math.PI * 0.75) * (1 - finish * 0.5);
            ctx.fillStyle = i % 2 ? "#d4b16c" : "#bd9acf";
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.quadraticCurveTo(1, -1, 6, 0);
            ctx.quadraticCurveTo(1, 1, 0, 6);
            ctx.quadraticCurveTo(-1, 1, -6, 0);
            ctx.quadraticCurveTo(-1, -1, 0, -6);
            ctx.fill();
            ctx.restore();
          }
        }
        return canvas.toDataURL("image/png").split(",")[1];
      };
    },
    await Promise.all([
      data("heart"),
      data("lock-1"),
      data("lock-2"),
      data("lock-3"),
    ]),
  );
  const metadata = [];
  for (const cost of [1, 2, 3]) {
    const duration = 6,
      frames = Math.ceil(duration * 30);
    const output = `public/skills/unlock-${cost}.mp4`;
    const encoder = spawn(
      "ffmpeg",
      [
        "-y",
        "-f",
        "image2pipe",
        "-framerate",
        "30",
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        output,
      ],
      { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] },
    );
    let errors = "";
    encoder.stderr.on("data", (chunk) => (errors += chunk));
    const finished = once(encoder, "close");
    for (let i = 0; i < frames; i++) {
      const frame = Buffer.from(
        await page.evaluate((args) => window.renderLockFrame(args), {
          cost,
          t: i / 30,
        }),
        "base64",
      );
      if (i === 0)
        await sharp(frame)
          .webp({ quality: 88 })
          .toFile(`public/skills/unlock-${cost}-poster.webp`);
      if (!encoder.stdin.write(frame)) await once(encoder.stdin, "drain");
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw Error(errors);
    for (const [label, t] of [
      ["filled", 4.1],
      ["open", duration - 0.15],
    ]) {
      await writeFile(
        `.artifacts/skill-unlock/${cost}-${label}.png`,
        Buffer.from(
          await page.evaluate((args) => window.renderLockFrame(args), {
            cost,
            t,
          }),
          "base64",
        ),
      );
    }
    metadata.push({ cost, duration: frames / 30, file: output });
    console.log(`Rendered ${output}: ${(frames / 30).toFixed(2)} seconds`);
  }
  await writeFile(
    "art/skills/unlock-videos.json",
    JSON.stringify(
      {
        renderer: "scripts/render-skill-unlock-videos.mjs",
        source: "Existing image_gen heart and empty lock WebP assets",
        format: "640x640, 30fps, silent H.264, faststart",
        clips: metadata,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
