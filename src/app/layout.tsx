import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { siteUrl } from "@/lib/site";
import { SourceCapture } from "@/components/source-capture";
import { CollectionProvider } from "@/components/collection-provider";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "공부결 — 나다운 공부의 시작", template: "%s | 공부결" },
  description:
    "16개의 질문으로 발견하는 나의 공부 스타일. 가입 없이 시작하고, 오늘 해볼 10분 공부법을 찾아보세요.",
  openGraph: {
    locale: "ko_KR",
    type: "website",
    siteName: "공부결",
    title: "공부결 — 나다운 공부의 시작",
    description:
      "남들 말고, 나답게 공부. 나의 공부 취향을 발견하는 16개의 질문.",
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
