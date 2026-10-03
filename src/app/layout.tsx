import type { Metadata, Viewport } from "next";
import { Header, Footer } from "@/components/shell";
import { QuickMenu } from "@/components/quick-menu";
import { siteUrl } from "@/lib/site";
import { SourceCapture } from "@/components/source-capture";
import { CollectionProvider } from "@/components/collection-provider";
import { AccountResultsProvider } from "@/components/account-results-provider";
import { QUESTIONS } from "@/lib/content";
import { shareImagePath } from "@/lib/share-image";
import "./globals.css";
export const viewport: Viewport = {
  themeColor: "#27785d",
};
export const metadata: Metadata = {
  applicationName: "StudyCrew",
  appleWebApp: { capable: true, title: "StudyCrew", statusBarStyle: "default" },
  metadataBase: new URL(siteUrl()),
  title: {
    default: "StudyCrew — 나와 닮은 공부캐를 만나요",
    template: "%s | StudyCrew",
  },
  description: `StudyCrew에서 나와 닮은 공부캐를 만나고, 나만의 공부법을 발견해요. ${QUESTIONS.length}개의 질문으로 첫 친구를 찾고, 캐릭터 도감과 공부 스킬북, 미션을 즐겨 보세요. 성격·능력을 진단하는 검사가 아니에요.`,
  openGraph: {
    locale: "ko_KR",
    type: "website",
    siteName: "StudyCrew",
    title: "StudyCrew — 나와 닮은 공부캐를 만나요",
    description:
      "나와 닮은 공부캐를 만나고, 도감을 채우며 다양한 공부법과 미션을 즐겨 보세요.",
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
          <AccountResultsProvider>
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
          </AccountResultsProvider>
        </CollectionProvider>
      </body>
    </html>
  );
}
