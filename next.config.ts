import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
    localPatterns: [
      { pathname: "/**", search: "" },
      // Content hashes let reviewed goods replace cached artwork immediately.
      { pathname: "/goods/*.webp" },
    ],
  },
  outputFileTracingIncludes: {
    "/api/goods/image": [
      "./art/goods/*.webp",
      "./public/characters/thumbs/*.png",
      "./public/fonts/Pretendard-Medium.woff",
    ],
    "/api/result-card": [
      "./public/result-cards/*-fixed-v2.webp",
      "./public/fonts/Pretendard-Medium.woff",
    ],
    "/api/collection/special-card": [
      "./art/characters/special/group-photo.webp",
      "./art/characters/special/group-photo.png",
      "./art/characters/special/families/*.webp",
      "./art/characters/special/families/*.png",
      "./art/characters/special/families/*.mp4",
    ],
    "/api/og": [
      "./public/fonts/Pretendard-Bold.woff",
      "./public/characters/share/*.png",
      "./public/characters/teacher-tori-share.png",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
