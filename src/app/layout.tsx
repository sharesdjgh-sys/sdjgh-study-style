import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { siteUrl } from "@/lib/site";
import { SourceCapture } from "@/components/source-capture";
import { CollectionProvider } from "@/components/collection-provider";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "공부캐 — 너의 공부캐는 누구?", template: "%s | 공부캐" },
  description:
    "재미로 만나는 나의 공부캐! 16개의 질문으로 캐릭터를 만나고, 다양한 공부 스타일과 공부법을 탐색해 보세요. 성격·능력을 진단하는 검사가 아니에요.",
  openGraph: {
    locale: "ko_KR",
    type: "website",
    siteName: "공부캐",
    title: "공부캐 — 너의 공부캐는 누구?",
    description:
      "16명 중, 너의 공부캐는 누구? 재미로 즐기고 다양한 공부 스타일과 공부법을 발견해요.",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <CollectionProvider>
          <SourceCapture />
          <a className="skip-link" href="#main">
            본문으로 바로가기
          </a>
          <div className="site-shell">
            <Header />
            {children}
            <Footer />
          </div>
        </CollectionProvider>
      </body>
    </html>
  );
}
