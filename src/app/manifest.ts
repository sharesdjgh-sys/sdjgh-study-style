import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "StudyCrew",
    short_name: "StudyCrew",
    description:
      "나와 닮은 공부캐를 만나고, 도감을 채우며 나만의 공부법을 발견해요.",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8f2",
    theme_color: "#27785d",
    icons: [
      {
        src: "/brand/study-friends-v2-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/study-friends-v2-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/study-friends-v2-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
