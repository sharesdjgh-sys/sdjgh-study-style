import { loadEnvFile } from "node:process";
import { access, readFile, writeFile } from "node:fs/promises";
import {
  specs,
  workRoot,
  outputRoot,
  prepareInput,
  prepareOutput,
  estimate,
} from "./character-video-common.mjs";

const code = process.argv.find((arg) => arg.startsWith("--code="))?.slice(7);
if (code && !specs.some((spec) => spec.code === code))
  throw new Error("Unknown character code");
const selected = code ? specs.filter((spec) => spec.code === code) : specs;
const generate = process.argv.includes("--generate");
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return false;
  }
};
let key;
if (generate) {
  loadEnvFile(".env.local");
  key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("Missing GEMINI_API_KEY");
}
const sanitize = (value) =>
  String(value ?? "")
    .split(key ?? "UNUSED_SECRET")
    .join("[REDACTED]")
    .replace(/AIza[\w-]+/g, "[REDACTED]");
let spent = 0,
  requests = 0;
for (const spec of selected) {
  const prepared = await prepareInput(spec);
  if (!generate) {
    console.log(
      JSON.stringify({ code: spec.code, stage: "prepared", paidRequests: 0 }),
    );
    continue;
  }
  const recordPath = `${workRoot}/${spec.code}/generation.json`;
  const finalVideo = `${outputRoot}/${spec.code}-loop-v1.mp4`;
  if (await exists(recordPath)) {
    const previous = JSON.parse(await readFile(recordPath, "utf8"));
    if (previous.status !== "completed")
      throw new Error(
        `${spec.code}: prior attempt requires inspection; no retry`,
      );
    spent += estimate(previous.usage);
    if (!(await exists(finalVideo))) await prepareOutput(spec);
    console.log(
      JSON.stringify({
        code: spec.code,
        stage: "reused",
        estimatedUSD: estimate(previous.usage),
      }),
    );
    continue;
  }
  if (await exists(finalVideo))
    throw new Error(
      `${spec.code}: existing output prevents a paid replacement`,
    );
  if (spent + 1.2 > 18)
    throw new Error(
      "Batch estimate would exceed $18; stopped before next paid request",
    );
  const record = {
    character: spec.code,
    model: "gemini-omni-1.1-flash",
    requestedSeconds: 10,
    resolution: "720p",
    startedAt: new Date().toISOString(),
    status: "started",
    requests: 1,
  };
  await writeFile(recordPath, JSON.stringify(record, null, 2), { flag: "wx" });
  requests++;
  console.log(
    JSON.stringify({
      code: spec.code,
      name: spec.name,
      stage: "request",
      requestNumber: requests,
      estimatedSpendSoFar: spent,
    }),
  );
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          model: record.model,
          input: [
            {
              type: "image",
              data: prepared.frame.toString("base64"),
              mime_type: "image/png",
            },
            { type: "text", text: prepared.prompt },
          ],
          response_format: {
            type: "video",
            resolution: "720p",
            aspect_ratio: "16:9",
          },
          background: false,
          store: false,
          stream: false,
        }),
        signal: AbortSignal.timeout(600000),
      },
    );
    const data = await response.json();
    record.httpStatus = response.status;
    if (!response.ok)
      throw new Error(
        sanitize(data.error?.message ?? `HTTP ${response.status}`),
      );
    const video = (data.steps ?? [])
      .filter((s) => s.type === "model_output")
      .flatMap((s) => s.content ?? [])
      .find((c) => c.type === "video");
    let bytes;
    if (video?.data) bytes = Buffer.from(video.data, "base64");
    else if (video?.uri) {
      const url = new URL(video.uri);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "generativelanguage.googleapis.com"
      )
        throw new Error("Unexpected download host");
      const download = await fetch(url, {
        headers: { "x-goog-api-key": key },
        redirect: "error",
        signal: AbortSignal.timeout(60000),
      });
      if (!download.ok)
        throw new Error(`Download failed: HTTP ${download.status}`);
      bytes = Buffer.from(await download.arrayBuffer());
    } else throw new Error("No video returned");
    await writeFile(`${prepared.directory}/raw.mp4`, bytes);
    Object.assign(record, {
      status: "completed",
      finishedAt: new Date().toISOString(),
      bytes: bytes.length,
      usage: data.usage,
    });
  } catch (error) {
    Object.assign(record, {
      status: "failed-or-unknown",
      message: sanitize(error.message),
      causeCode: error.cause?.code,
    });
    console.error(
      JSON.stringify({
        code: spec.code,
        status: record.status,
        message: record.message,
      }),
    );
    process.exitCode = 1;
  } finally {
    await writeFile(recordPath, JSON.stringify(record, null, 2));
  }
  if (process.exitCode) break;
  const metadata = await prepareOutput(spec);
  spent += metadata.estimatedUSD;
  console.log(
    JSON.stringify({
      code: spec.code,
      name: spec.name,
      stage: "completed",
      seconds: Number(metadata.delivery.format.duration),
      bytes: metadata.delivery.format.size,
      estimatedUSD: metadata.estimatedUSD,
      totalEstimatedUSD: spent,
      boundaryMeanPixelDifference: metadata.boundaryMeanPixelDifference,
    }),
  );
}
console.log(
  JSON.stringify({
    stage: "summary",
    newPaidRequests: requests,
    estimatedUSD: spent,
    preparedOnly: !generate,
  }),
);
