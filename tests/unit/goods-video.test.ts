import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  query: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@/lib/collection-server", () => ({
  account: mocks.account,
  json: (data: unknown, status = 200) => Response.json(data, { status }),
}));
vi.mock("@/lib/db", () => ({ database: () => mocks.query }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.read }));
import { GET, HEAD } from "../../src/app/api/goods/video/route";
const url =
  "http://localhost/api/goods/video?id=visual-solo-planned--motion-01";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.account.mockResolvedValue({ id: "owner" });
  mocks.query.mockResolvedValue([{}]);
  mocks.read.mockResolvedValue(Buffer.from("0123456789abcdef"));
});
it("미로그인·미소장은 파일 접근 없이 차단한다", async () => {
  mocks.account.mockResolvedValue(null);
  expect((await GET(new Request(url))).status).toBe(401);
  expect(mocks.read).not.toHaveBeenCalled();
  mocks.account.mockResolvedValue({ id: "other" });
  mocks.query.mockResolvedValue([]);
  expect((await GET(new Request(url))).status).toBe(403);
  expect(mocks.read).not.toHaveBeenCalled();
  expect(mocks.query.mock.calls[0].slice(1)).toEqual([
    "other",
    "visual-solo-planned--motion-01",
  ]);
});
it("소장 영상의 범위·HEAD·다운로드와 잘못된 범위를 처리한다", async () => {
  const ranged = await GET(
    new Request(url, { headers: { Range: "bytes=2-5" } }),
  );
  expect(ranged.status).toBe(206);
  expect(await ranged.text()).toBe("2345");
  expect(ranged.headers.get("content-range")).toBe("bytes 2-5/16");
  expect(ranged.headers.get("cache-control")).toBe("private, no-store");
  const suffix = await GET(
    new Request(url, { headers: { Range: "bytes=-3" } }),
  );
  expect(await suffix.text()).toBe("def");
  for (const range of [
    "bytes=20-",
    "bytes=-0",
    "bytes=8-3",
    "bytes=",
    "bytes=0-1,4-5",
  ])
    expect(
      (await GET(new Request(url, { headers: { Range: range } }))).status,
    ).toBe(416);
  const head = await HEAD(new Request(url, { method: "HEAD" }));
  expect(await head.text()).toBe("");
  expect(head.headers.get("content-length")).toBe("16");
  expect(
    (await GET(new Request(url + "&download=1"))).headers.get(
      "content-disposition",
    ),
  ).toContain("attachment");
});
it("일반 이미지 카드나 잘못된 경로로 영상 파일을 읽을 수 없다", async () => {
  expect(
    (await GET(new Request(url.replace("motion-01", "daily-01")))).status,
  ).toBe(400);
  expect(
    (await GET(new Request("http://localhost/api/goods/video?id=../../env")))
      .status,
  ).toBe(400);
  expect(mocks.read).not.toHaveBeenCalled();
});
