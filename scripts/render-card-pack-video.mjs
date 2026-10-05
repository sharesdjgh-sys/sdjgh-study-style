// Offline motion rendering. No credentials, API calls, or external requests.
import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import sharp from "sharp";

const output = "public/rewards";
await mkdir(output, { recursive: true });
const source = `data:image/webp;base64,${(await readFile("public/ui-icons/card-pack-v1.webp")).toString("base64")}`;
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.setContent('<canvas width="720" height="960"></canvas>');
  await page.evaluate(async (source) => {
    const img = new Image();
    img.src = source;
    await img.decode();
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const ease = (t, a, b) => {
      const v = Math.max(0, Math.min(1, (t - a) / (b - a)));
      return v * v * (3 - 2 * v);
    };
    window.renderFrame = (t) => {
      ctx.clearRect(0, 0, 720, 960);
      ctx.fillStyle = "#fff9ed";
      ctx.fillRect(0, 0, 720, 960);
      const glow = ctx.createRadialGradient(360, 440, 40, 360, 440, 430);
      glow.addColorStop(0, "#e4ecd5");
      glow.addColorStop(1, "#fff9ed");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 720, 960);
      const tear = ease(t, 0.35, 1.15),
        rise = ease(t, 1, 2.4),
        leave = ease(t, 2.1, 3.25);
      const sway = Math.sin(t * 24) * 5 * (1 - ease(t, 0.2, 0.65));
      const packetY = 30 + rise * 150 + leave * 850;
      const cardY = 260 - rise * 185 + leave * 165;
      const seam = img.height * 0.117;
      const scale = 600 / img.width;
      // The hidden card is behind the physical front of the packet.
      ctx.save();
      ctx.translate(360 + sway, cardY + 215);
      ctx.rotate(-0.035 * (1 - leave));
      ctx.shadowColor = "#153e3a35";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#285544";
      ctx.beginPath();
      ctx.roundRect(-160, -215, 320, 430, 18);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#e7ddba";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-145, -200, 290, 400, 12);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-138, -193, 276, 386, 10);
      ctx.stroke();
      ctx.fillStyle = "#f1e8c9";
      ctx.textAlign = "center";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("STUDYCREW", 0, 100);
      ctx.font = "12px sans-serif";
      ctx.fillText("MEET YOUR STUDY FRIEND", 0, 126);
      ctx.strokeStyle = "#f1e8c9";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.quadraticCurveTo(-30, -4, -60, 0);
      ctx.lineTo(-60, -58);
      ctx.quadraticCurveTo(-30, -64, 0, -44);
      ctx.quadraticCurveTo(30, -64, 60, -58);
      ctx.lineTo(60, 0);
      ctx.quadraticCurveTo(30, -4, 0, 15);
      ctx.lineTo(0, -44);
      ctx.stroke();
      for (const x of [-100, 100]) {
        ctx.beginPath();
        ctx.arc(x, -23, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.drawImage(
        img,
        0,
        seam,
        img.width,
        img.height - seam,
        60 + sway,
        packetY + seam * scale,
        600,
        (img.height - seam) * scale,
      );
      ctx.save();
      ctx.translate(
        360 + sway + tear * 165,
        packetY + seam * scale - tear * 130,
      );
      ctx.rotate(tear * 0.38);
      ctx.globalAlpha = 1 - ease(t, 0.85, 1.35);
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        seam,
        -300,
        -seam * scale,
        600,
        seam * scale,
      );
      ctx.restore();
      return canvas.toDataURL("image/png").split(",")[1];
    };
  }, source);
  const ffmpeg = spawn(
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
      "22",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      `${output}/card-pack-opening-v1.mp4`,
    ],
    { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] },
  );
  let errors = "";
  ffmpeg.stderr.on("data", (chunk) => (errors += chunk));
  const finished = once(ffmpeg, "close");
  for (let i = 0; i < 108; i++) {
    const frame = Buffer.from(
      await page.evaluate((t) => window.renderFrame(t), i / 30),
      "base64",
    );
    if (i === 0)
      await sharp(frame)
        .webp({ quality: 86 })
        .toFile(`${output}/card-pack-poster-v1.webp`);
    if (!ffmpeg.stdin.write(frame)) await once(ffmpeg.stdin, "drain");
  }
  ffmpeg.stdin.end();
  const [code] = await finished;
  if (code !== 0) throw Error(errors);
  console.log(
    "Rendered 3.6-second H.264 MP4 locally: public/rewards/card-pack-opening-v1.mp4",
  );
} finally {
  await browser.close();
}
