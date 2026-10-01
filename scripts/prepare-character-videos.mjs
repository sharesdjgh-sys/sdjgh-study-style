import { specs, prepareOutput } from "./character-video-common.mjs";

const code = process.argv.find((arg) => arg.startsWith("--code="))?.slice(7);
if (code && !specs.some((spec) => spec.code === code))
  throw new Error("Unknown character code");
for (const spec of code ? specs.filter((spec) => spec.code === code) : specs) {
  const metadata = await prepareOutput(spec);
  console.log(
    JSON.stringify({
      code: spec.code,
      stage: "prepared-from-saved-video",
      newPaidRequests: 0,
      boundaryMeanPixelDifference: metadata.boundaryMeanPixelDifference,
    }),
  );
}
