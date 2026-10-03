import type { Metadata, Viewport } from "next";
import { Header, Footer } from "@/components/shell";
import { QuickMenu } from "@/components/quick-menu";
import { siteUrl } from "@/lib/site";
import { SourceCapture } from "@/components/source-capture";
import { CollectionProvider } from "@/components/collection-provider";
import { QUESTIONS } from "@/lib/content";
import { shareImagePath } from "@/lib/share-image";
import "./globals.css";
export const viewport: Viewport = {
  themeColor: "#27785d",
};
export const metadata: Metadata = {
  applicationName: "공부캐",
  appleWebApp: { capable: true, title: "공부캐", statusBarStyle: "default" },
  metadataBase: new URL(siteUrl()),
  title: { default: "공부캐 — 너의 공부캐는 누구?", template: "%s | 공부캐" },
  description: `재미로 만나는 귀여운 공부캐! ${QUESTIONS.length}개의 질문으로 캐릭터를 만나고, 다양한 공부 스타일과 공부법을 탐색해 보세요. 성격·능력을 진단하는 검사가 아니에요.`,
  openGraph: {
    locale: "ko_KR",
    type: "website",
    siteName: "공부캐",
    title: "공부 스타일을 캐릭터로 만나는 테스트",
    description:
      "평소 공부하는 모습을 골라 나만의 캐릭터를 찾고, 다양한 공부법을 탐색해 보세요.",
    images: [{ url: shareImagePath(), width: 1200, height: 630 }],
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
          <QuickMenu />
        </CollectionProvider>
      </body>
    </html>
  );
}
