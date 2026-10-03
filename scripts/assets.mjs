import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
const names = [
  "arrow-right-linear",
  "arrow-left-linear",
  "arrow-right-up-linear",
  "check-circle-linear",
  "check-read-linear",
  "close-circle-linear",
  "clock-circle-linear",
  "map-linear",
  "headphones-round-sound-linear",
  "layers-linear",
  "routing-2-linear",
  "stars-linear",
  "copy-linear",
  "share-linear",
  "restart-linear",
  "book-bookmark-linear",
  "shield-check-linear",
  "alt-arrow-down-linear",
  "add-circle-linear",
  "play-linear",
  "pause-linear",
  "checklist-minimalistic-linear",
  "users-group-rounded-linear",
  "user-rounded-linear",
  "calendar-linear",
  "chat-round-dots-linear",
  "home-smile-linear",
];
const all = JSON.parse(
  await readFile("node_modules/@iconify-json/solar/icons.json", "utf8"),
);
const selected = Object.fromEntries(
  names.map((name) => {
    if (!all.icons[name]) throw new Error(name);
    return [name, all.icons[name].body];
  }),
);
await mkdir("src/lib", { recursive: true });
await writeFile("src/lib/icons.json", JSON.stringify(selected));
await mkdir("public/fonts", { recursive: true });
await copyFile(
  "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  "public/fonts/PretendardVariable.woff2",
);
await copyFile(
  "node_modules/pretendard/dist/web/static/woff/Pretendard-Bold.woff",
  "public/fonts/Pretendard-Bold.woff",
);
console.log("Solar 아이콘과 Pretendard 자체 호스팅 파일 준비 완료");
